#!/usr/bin/env python3
"""
Simple Athens Crime Data Processor - No Emojis
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

class SimpleAthensCrimeProcessor:
    def __init__(self, csv_file_path='athens_crime_data.csv'):
        self.csv_file = csv_file_path
        self.raw_data = None
        self.clean_data = None
        self.stats = {}
        
    def load_and_inspect(self):
        print("Loading Athens Crime Data...")
        
        try:
            self.raw_data = pd.read_csv(self.csv_file)
            print(f"Loaded {len(self.raw_data)} crime incidents")
            print(f"Columns: {list(self.raw_data.columns)}")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def clean_and_process_data(self):
        print("Cleaning Athens Crime Data...")
        
        if self.raw_data is None:
            print("No raw data loaded!")
            return False
        
        df = self.raw_data.copy()
        initial_count = len(df)
        
        # Clean datetime
        print("Processing datetime data...")
        try:
            df['CFSDate'] = pd.to_datetime(df['CFSDate'])
            df['Hour'] = df['CFSDate'].dt.hour
            df['DayOfWeek'] = df['CFSDate'].dt.dayofweek
            df['Month'] = df['CFSDate'].dt.month
            df['Year'] = df['CFSDate'].dt.year
            print(f"Processed {len(df)} datetime records")
        except Exception as e:
            print(f"Datetime processing error: {e}")
            return False
        
        # Clean coordinates
        print("Processing geographic data...")
        before_geo_clean = len(df)
        
        # Remove rows with invalid coordinates
        df = df.dropna(subset=['Longitude', 'Latitude'])
        
        # Check for reasonable Athens coordinate bounds
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
        
        print(f"Geographic cleaning: {before_geo_clean} -> {len(df)} records")
        
        # Clean incident types
        print("Processing incident types...")
        df = df.dropna(subset=['IncidentType'])
        
        # Standardize incident type categories
        df['SafetyCategory'] = df['IncidentType'].apply(self._categorize_incident)
        df['SafetyWeight'] = df['SafetyCategory'].map(self._get_safety_weights())
        
        print("Incident type processing complete")
        
        # Add additional fields
        print("Adding analysis fields...")
        
        # Time-based features
        df['IsNighttime'] = (df['Hour'] >= 20) | (df['Hour'] <= 6)
        df['IsWeekend'] = df['DayOfWeek'].isin([5, 6])
        df['TimeCategory'] = df['Hour'].apply(self._categorize_time)
        
        # Geographic features
        df['GridLat'] = (df['Latitude'] * 1000).round().astype(int)
        df['GridLon'] = (df['Longitude'] * 1000).round().astype(int)
        df['GridId'] = df['GridLat'].astype(str) + '_' + df['GridLon'].astype(str)
        
        print("Added time and spatial indexing fields")
        
        # Final validation
        final_count = len(df)
        self.clean_data = df
        
        print(f"Data Cleaning Complete!")
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
        if pd.isna(incident_type):
            return 'UNKNOWN'
            
        incident = str(incident_type).upper()
        
        if any(word in incident for word in ['ASSAULT', 'ROBBERY', 'BATTERY', 'WEAPON', 'SHOOTING', 'STABBING', 'MURDER', 'HOMICIDE']):
            return 'HIGH_RISK'
        elif any(word in incident for word in ['THEFT', 'BURGLARY', 'BREAK', 'STOLEN', 'LARCENY', 'FRAUD', 'VANDALISM']):
            return 'MEDIUM_RISK'
        elif any(word in incident for word in ['TRAFFIC', 'PARKING', 'NOISE', 'COMMUNITY', 'DISTURBANCE', 'WELFARE']):
            return 'LOW_RISK'
        elif any(word in incident for word in ['DRUG', 'NARCOTIC', 'SUBSTANCE']):
            return 'DRUG_RELATED'
        else:
            return 'OTHER'
    
    def _get_safety_weights(self):
        return {
            'HIGH_RISK': 1.0,
            'MEDIUM_RISK': 0.6,
            'DRUG_RELATED': 0.5,
            'OTHER': 0.3,
            'LOW_RISK': 0.1,
            'UNKNOWN': 0.2
        }
    
    def _categorize_time(self, hour):
        if 6 <= hour < 12:
            return 'MORNING'
        elif 12 <= hour < 18:
            return 'AFTERNOON'  
        elif 18 <= hour < 22:
            return 'EVENING'
        else:
            return 'NIGHT'
    
    def save_processed_data(self, output_file='processed_crime_data.json'):
        if self.clean_data is None:
            print("No clean data to save!")
            return False
        
        print(f"Saving processed data to {output_file}...")
        
        output_data = {
            'metadata': self.stats,
            'incidents': []
        }
        
        sample_df = self.clean_data.copy()
        print(f"Exporting {len(sample_df)} crime incidents")
        
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
        
        try:
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2)
            
            print(f"Saved {len(output_data['incidents'])} incidents to {output_file}")
            print(f"File size: {os.path.getsize(output_file) / 1024:.1f} KB")
            return True
            
        except Exception as e:
            print(f"Error saving data: {e}")
            return False

def main():
    print("Starting Athens Crime Data Processing Pipeline")
    print("=" * 60)
    
    processor = SimpleAthensCrimeProcessor()
    
    if not processor.load_and_inspect():
        return
    
    if not processor.clean_and_process_data():
        return
    
    processor.save_processed_data()
    
    print("\nAthens crime data processing complete!")
    print("Next steps:")
    print("   1. Review the processed_crime_data.json file")
    print("   2. Start the Flask server: python app.py")

if __name__ == "__main__":
    main()
