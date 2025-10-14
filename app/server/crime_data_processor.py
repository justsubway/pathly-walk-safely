#!/usr/bin/env python3
"""
Athens Crime Data Processing Pipeline
Step 2: Import & Clean Crime CSV Data using pandas
Adapted for Athens, Greece
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

class AthensCrimeProcessor:
    def __init__(self, csv_file_path='athens_crime_data.csv'):
        """Initialize the crime data processor"""
        self.csv_file = csv_file_path
        self.raw_data = None
        self.clean_data = None
        self.stats = {}
        
    def load_and_inspect(self):
        """Load CSV and perform initial inspection"""
        print("🔍 Loading Athens Crime Data...")
        
        try:
            # Load CSV with pandas
            self.raw_data = pd.read_csv(self.csv_file)
            
            print(f"✅ Loaded {len(self.raw_data)} crime incidents")
            print(f"📊 Columns: {list(self.raw_data.columns)}")
            
            # Basic info
            print("\n📈 Dataset Info:")
            print(f"Shape: {self.raw_data.shape}")
            print(f"Memory usage: {self.raw_data.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
            
            # Check for missing values
            print("\n🔍 Missing Values Check:")
            missing = self.raw_data.isnull().sum()
            for col, count in missing[missing > 0].items():
                print(f"  {col}: {count} missing ({count/len(self.raw_data)*100:.1f}%)")
            
            # Inspect key columns
            print("\n🗺️ Geographic Data:")
            print(f"  Longitude range: {self.raw_data['Longitude'].min():.6f} to {self.raw_data['Longitude'].max():.6f}")
            print(f"  Latitude range: {self.raw_data['Latitude'].min():.6f} to {self.raw_data['Latitude'].max():.6f}")
            print(f"  Missing coordinates: {self.raw_data[['Longitude', 'Latitude']].isnull().any(axis=1).sum()}")
            
            # Incident types
            print("\n🚨 Incident Types (Top 10):")
            incident_counts = self.raw_data['IncidentType'].value_counts().head(10)
            for incident, count in incident_counts.items():
                print(f"  {incident}: {count}")
                
            return True
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    def clean_and_process_data(self):
        """Clean and validate the crime data"""
        print("\n🧹 Cleaning Athens Crime Data...")
        
        if self.raw_data is None:
            print("❌ No raw data loaded!")
            return False
        
        # Start with a copy
        df = self.raw_data.copy()
        initial_count = len(df)
        
        # 1. Clean datetime
        print("📅 Processing datetime data...")
        try:
            df['CFSDate'] = pd.to_datetime(df['CFSDate'])
            df['Hour'] = df['CFSDate'].dt.hour
            df['DayOfWeek'] = df['CFSDate'].dt.dayofweek  # 0=Monday, 6=Sunday
            df['Month'] = df['CFSDate'].dt.month
            df['Year'] = df['CFSDate'].dt.year
            print(f"✅ Processed {len(df)} datetime records")
        except Exception as e:
            print(f"❌ Datetime processing error: {e}")
            return False
        
        # 2. Clean coordinates
        print("🗺️ Processing geographic data...")
        # Remove rows with invalid coordinates
        before_geo_clean = len(df)
        
        # Check for missing coordinates
        df = df.dropna(subset=['Longitude', 'Latitude'])
        
        # Check for reasonable Athens coordinate bounds
        # Athens rough bounds: Lat 37.9-38.1, Lon 23.6-23.9
        athens_bounds = {
            'lat_min': 37.9, 'lat_max': 38.1,
            'lon_min': 23.6, 'lon_max': 23.9
        }
        
        # Filter to Athens area
        in_bounds = (
            (df['Latitude'] >= athens_bounds['lat_min']) & 
            (df['Latitude'] <= athens_bounds['lat_max']) &
            (df['Longitude'] >= athens_bounds['lon_min']) & 
            (df['Longitude'] <= athens_bounds['lon_max'])
        )
        
        df = df[in_bounds]
        
        print(f"✅ Geographic cleaning: {before_geo_clean} → {len(df)} records")
        print(f"   Removed {before_geo_clean - len(df)} out-of-bounds incidents")
        
        # 3. Clean incident types
        print("🚨 Processing incident types...")
        # Remove null incident types
        df = df.dropna(subset=['IncidentType'])
        
        # Standardize incident type categories for safety scoring
        df['SafetyCategory'] = df['IncidentType'].apply(self._categorize_incident)
        df['SafetyWeight'] = df['SafetyCategory'].map(self._get_safety_weights())
        
        print(f"✅ Incident type processing complete")
        
        # 4. Add additional fields for analysis
        print("🔧 Adding analysis fields...")
        
        # Time-based features
        df['IsNighttime'] = (df['Hour'] >= 20) | (df['Hour'] <= 6)
        df['IsWeekend'] = df['DayOfWeek'].isin([5, 6])  # Saturday, Sunday
        df['TimeCategory'] = df['Hour'].apply(self._categorize_time)
        
        # Geographic features (we'll use these for grid system)
        df['GridLat'] = (df['Latitude'] * 1000).round().astype(int)  # For spatial indexing
        df['GridLon'] = (df['Longitude'] * 1000).round().astype(int)
        df['GridId'] = df['GridLat'].astype(str) + '_' + df['GridLon'].astype(str)
        
        print(f"✅ Added time and spatial indexing fields")
        
        # 5. Final validation
        final_count = len(df)
        self.clean_data = df
        
        print(f"\n✅ Data Cleaning Complete!")
        print(f"   Initial records: {initial_count}")
        print(f"   Final records: {final_count}")
        print(f"   Data retention: {final_count/initial_count*100:.1f}%")
        
        # Store cleaning stats
        self.stats = {
            'initial_records': initial_count,
            'final_records': final_count,
            'retention_rate': final_count/initial_count,
            'date_range': {
                'start': df['CFSDate'].min().isoformat(),
                'end': df['CFSDate'].max().isoformat()
            },
            'geographic_bounds': {
                'lat_range': [df['Latitude'].min(), df['Latitude'].max()],
                'lon_range': [df['Longitude'].min(), df['Longitude'].max()]
            },
            'incident_counts': df['SafetyCategory'].value_counts().to_dict(),
            'hourly_distribution': df['Hour'].value_counts().sort_index().to_dict()
        }
        
        return True
    
    def _categorize_incident(self, incident_type):
        """Categorize incident types by safety impact"""
        if pd.isna(incident_type):
            return 'UNKNOWN'
            
        incident = str(incident_type).upper()
        
        # High risk incidents
        if any(word in incident for word in ['ASSAULT', 'ROBBERY', 'BATTERY', 'WEAPON', 'SHOOTING', 'STABBING', 'MURDER', 'HOMICIDE']):
            return 'HIGH_RISK'
        
        # Medium risk incidents  
        elif any(word in incident for word in ['THEFT', 'BURGLARY', 'BREAK', 'STOLEN', 'LARCENY', 'FRAUD', 'VANDALISM']):
            return 'MEDIUM_RISK'
        
        # Low risk incidents
        elif any(word in incident for word in ['TRAFFIC', 'PARKING', 'NOISE', 'COMMUNITY', 'DISTURBANCE', 'WELFARE']):
            return 'LOW_RISK'
        
        # Drug related
        elif any(word in incident for word in ['DRUG', 'NARCOTIC', 'SUBSTANCE']):
            return 'DRUG_RELATED'
        
        # Default
        else:
            return 'OTHER'
    
    def _get_safety_weights(self):
        """Return safety weight mapping for each category"""
        return {
            'HIGH_RISK': 1.0,      # Highest impact on safety score
            'MEDIUM_RISK': 0.6,    # Moderate impact
            'DRUG_RELATED': 0.5,   # Moderate impact
            'OTHER': 0.3,          # Low impact
            'LOW_RISK': 0.1,       # Minimal impact
            'UNKNOWN': 0.2         # Default low-moderate impact
        }
    
    def _categorize_time(self, hour):
        """Categorize time of day for analysis"""
        if 6 <= hour < 12:
            return 'MORNING'
        elif 12 <= hour < 18:
            return 'AFTERNOON'  
        elif 18 <= hour < 22:
            return 'EVENING'
        else:
            return 'NIGHT'
    
    def generate_summary(self):
        """Generate a comprehensive data summary"""
        if self.clean_data is None:
            print("❌ No clean data available!")
            return
        
        print("\n📊 ATHENS CRIME DATA SUMMARY")
        print("=" * 50)
        
        df = self.clean_data
        
        print(f"📅 Time Period: {df['CFSDate'].min().strftime('%Y-%m-%d')} to {df['CFSDate'].max().strftime('%Y-%m-%d')}")
        print(f"📍 Total Incidents: {len(df):,}")
        print(f"🗺️ Geographic Coverage: {df['GridId'].nunique():,} unique grid cells")
        
        print("\n🚨 Safety Risk Distribution:")
        safety_dist = df['SafetyCategory'].value_counts()
        for category, count in safety_dist.items():
            pct = count / len(df) * 100
            print(f"  {category}: {count:,} ({pct:.1f}%)")
        
        print("\n🕐 Time Distribution:")
        time_dist = df['TimeCategory'].value_counts()
        for time_cat, count in time_dist.items():
            pct = count / len(df) * 100
            print(f"  {time_cat}: {count:,} ({pct:.1f}%)")
        
        print(f"\n🌙 Nighttime Incidents: {df['IsNighttime'].sum():,} ({df['IsNighttime'].mean()*100:.1f}%)")
        print(f"📅 Weekend Incidents: {df['IsWeekend'].sum():,} ({df['IsWeekend'].mean()*100:.1f}%)")
        
        print("\n🔥 Hottest Crime Hours:")
        hourly = df['Hour'].value_counts().sort_index()
        top_hours = hourly.nlargest(5)
        for hour, count in top_hours.items():
            print(f"  {hour:02d}:00 - {count:,} incidents")
        
        print("\n🗺️ Top Crime Areas:")
        neighborhoods = df['Neighborhood'].value_counts().head(5)
        for neighborhood, count in neighborhoods.items():
            if pd.notna(neighborhood):
                print(f"  {neighborhood}: {count:,} incidents")
    
    def save_processed_data(self, output_file='processed_crime_data.json'):
        """Save processed data for use in JavaScript/React Native"""
        if self.clean_data is None:
            print("❌ No clean data to save!")
            return False
        
        print(f"\n💾 Saving processed data to {output_file}...")
        
        # Convert to JSON-friendly format for React Native
        output_data = {
            'metadata': self.stats,
            'incidents': []
        }
        
        # Export ALL crime data
        sample_size = len(self.clean_data)
        sample_df = self.clean_data.copy()
        
        print(f"📦 Exporting {len(sample_df)} crime incidents (ALL DATA)")
        
        for _, row in sample_df.iterrows():
            incident = {
                'id': str(row['ObjectID']),
                'lat': float(row['Latitude']),
                'lon': float(row['Longitude']),
                'datetime': row['CFSDate'].isoformat(),
                'hour': int(row['Hour']),
                'incident_type': str(row['IncidentType']),
                'safety_category': str(row['SafetyCategory']),
                'safety_weight': float(row['SafetyWeight']),
                'neighborhood': str(row['Neighborhood']) if pd.notna(row['Neighborhood']) else None,
                'grid_id': str(row['GridId']),
                'is_nighttime': bool(row['IsNighttime']),
                'is_weekend': bool(row['IsWeekend']),
                'time_category': str(row['TimeCategory'])
            }
            output_data['incidents'].append(incident)
        
        # Save to JSON
        try:
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2)
            
            print(f"✅ Saved {len(output_data['incidents'])} incidents to {output_file}")
            print(f"📁 File size: {os.path.getsize(output_file) / 1024:.1f} KB")
            return True
            
        except Exception as e:
            print(f"❌ Error saving data: {e}")
            return False

def main():
    """Main processing pipeline"""
    print("🚀 Starting Athens Crime Data Processing Pipeline")
    print("=" * 60)
    
    # Initialize processor
    processor = AthensCrimeProcessor()
    
    # Step 1: Load and inspect
    if not processor.load_and_inspect():
        return
    
    # Step 2: Clean data
    if not processor.clean_and_process_data():
        return
    
    # Step 3: Generate summary
    processor.generate_summary()
    
    # Step 4: Save processed data
    processor.save_processed_data()
    
    print("\n🎉 Athens crime data processing complete!")
    print("📋 Next steps:")
    print("   1. Review the processed_crime_data.json file")
    print("   2. Test the grid system with this data")
    print("   3. Build safety scoring algorithms")

if __name__ == "__main__":
    main()
