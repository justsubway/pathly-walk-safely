#!/usr/bin/env python3
"""
Athens Crime Data Web Scraper
Automatically scrapes crime data from various sources and creates CSV files
"""

import requests
import pandas as pd
import json
import csv
import time
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import urllib.parse
from typing import List, Dict, Any
import argparse
import os

class AthensCrimeScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.scraped_data = []
        
    def scrape_greek_police_data(self, base_url: str, max_pages: int = 10):
        """Scrape from Greek Police website"""
        print("🔍 Scraping Greek Police data...")
        
        for page in range(1, max_pages + 1):
            try:
                url = f"{base_url}?page={page}"
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for incident containers (adjust selectors based on actual site)
                incidents = soup.find_all(['div', 'tr'], class_=re.compile(r'incident|crime|event', re.I))
                
                for incident in incidents:
                    data = self._extract_incident_data(incident)
                    if data:
                        self.scraped_data.append(data)
                
                print(f"   Page {page}: Found {len(incidents)} incidents")
                time.sleep(1)  # Be respectful
                
            except Exception as e:
                print(f"   Error on page {page}: {e}")
                continue
    
    def scrape_open_data_portal(self, api_url: str, dataset_id: str):
        """Scrape from Greek Open Data Portal"""
        print("🔍 Scraping Open Data Portal...")
        
        try:
            # Try different API endpoints
            endpoints = [
                f"{api_url}/api/3/action/datastore_search?resource_id={dataset_id}",
                f"{api_url}/api/3/action/package_show?id={dataset_id}",
                f"{api_url}/api/3/action/package_search?q=crime+athens"
            ]
            
            for endpoint in endpoints:
                try:
                    response = self.session.get(endpoint, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    if 'result' in data and 'records' in data['result']:
                        records = data['result']['records']
                        for record in records:
                            incident_data = self._convert_open_data_record(record)
                            if incident_data:
                                self.scraped_data.append(incident_data)
                        print(f"   Found {len(records)} records from Open Data Portal")
                        break
                        
                except Exception as e:
                    print(f"   API endpoint failed: {e}")
                    continue
                    
        except Exception as e:
            print(f"   Open Data Portal error: {e}")
    
    def scrape_news_sources(self, news_urls: List[str]):
        """Scrape crime incidents from news websites"""
        print("🔍 Scraping news sources...")
        
        for url in news_urls:
            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for article links containing crime keywords
                crime_keywords = ['κλοπή', 'ληστεία', 'επίθεση', 'κλοπή', 'αυτοκίνητο', 'κλέβουν']
                
                articles = soup.find_all('a', href=True)
                for article in articles:
                    text = article.get_text().lower()
                    if any(keyword in text for keyword in crime_keywords):
                        article_url = urllib.parse.urljoin(url, article['href'])
                        incident_data = self._scrape_news_article(article_url)
                        if incident_data:
                            self.scraped_data.append(incident_data)
                
                print(f"   Scraped {url}")
                time.sleep(2)  # Be respectful
                
            except Exception as e:
                print(f"   Error scraping {url}: {e}")
                continue
    
    def scrape_manual_data(self, data_file: str):
        """Import data from manually prepared files"""
        print("🔍 Importing manual data...")
        
        try:
            if data_file.endswith('.json'):
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            incident_data = self._convert_manual_record(item)
                            if incident_data:
                                self.scraped_data.append(incident_data)
                    elif isinstance(data, dict) and 'incidents' in data:
                        for item in data['incidents']:
                            incident_data = self._convert_manual_record(item)
                            if incident_data:
                                self.scraped_data.append(incident_data)
                                
            elif data_file.endswith('.csv'):
                df = pd.read_csv(data_file)
                for _, row in df.iterrows():
                    incident_data = self._convert_csv_record(row)
                    if incident_data:
                        self.scraped_data.append(incident_data)
                        
            print(f"   Imported {len(self.scraped_data)} records from {data_file}")
            
        except Exception as e:
            print(f"   Error importing {data_file}: {e}")
    
    def _extract_incident_data(self, element) -> Dict[str, Any]:
        """Extract incident data from HTML element"""
        try:
            # This is a template - adjust based on actual website structure
            text = element.get_text()
            
            # Try to extract date
            date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})', text)
            date_str = date_match.group(1) if date_match else datetime.now().strftime('%Y-%m-%d')
            
            # Try to extract time
            time_match = re.search(r'(\d{1,2}:\d{2})', text)
            time_str = time_match.group(1) if time_match else '12:00'
            
            # Try to extract location
            location_match = re.search(r'([Α-Ωα-ωάέήίόύώ\s]+)', text)
            location = location_match.group(1).strip() if location_match else 'Athens'
            
            # Try to extract incident type
            incident_type = 'INCIDENT'
            if any(word in text.lower() for word in ['κλοπή', 'theft']):
                incident_type = 'THEFT'
            elif any(word in text.lower() for word in ['ληστεία', 'robbery']):
                incident_type = 'ROBBERY'
            elif any(word in text.lower() for word in ['επίθεση', 'assault']):
                incident_type = 'ASSAULT'
            
            # Generate approximate coordinates for Athens
            lat, lon = self._get_athens_coordinates(location)
            
            return {
                'ObjectID': len(self.scraped_data) + 1,
                'CFSDate': f"{date_str} {time_str}",
                'IncidentType': incident_type,
                'Neighborhood': location,
                'Longitude': lon,
                'Latitude': lat
            }
            
        except Exception as e:
            print(f"   Error extracting incident data: {e}")
            return None
    
    def _convert_open_data_record(self, record: Dict) -> Dict[str, Any]:
        """Convert Open Data Portal record to our format"""
        try:
            # Map common field names
            date_field = None
            for field in ['date', 'datetime', 'incident_date', 'created_at']:
                if field in record:
                    date_field = field
                    break
            
            lat_field = None
            for field in ['lat', 'latitude', 'y', 'coord_y']:
                if field in record:
                    lat_field = field
                    break
                    
            lon_field = None
            for field in ['lon', 'longitude', 'x', 'coord_x']:
                if field in record:
                    lon_field = field
                    break
            
            incident_type_field = None
            for field in ['type', 'incident_type', 'category', 'offense']:
                if field in record:
                    incident_type_field = field
                    break
            
            return {
                'ObjectID': record.get('id', len(self.scraped_data) + 1),
                'CFSDate': record.get(date_field, datetime.now().isoformat()),
                'IncidentType': record.get(incident_type_field, 'INCIDENT'),
                'Neighborhood': record.get('neighborhood', 'Athens'),
                'Longitude': float(record.get(lon_field, 23.7348)),
                'Latitude': float(record.get(lat_field, 37.9755))
            }
            
        except Exception as e:
            print(f"   Error converting Open Data record: {e}")
            return None
    
    def _scrape_news_article(self, url: str) -> Dict[str, Any]:
        """Scrape individual news article for crime data"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            text = soup.get_text()
            
            # Extract date from article
            date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})', text)
            date_str = date_match.group(1) if date_match else datetime.now().strftime('%Y-%m-%d')
            
            # Extract location
            location_match = re.search(r'([Α-Ωα-ωάέήίόύώ\s]+)', text)
            location = location_match.group(1).strip() if location_match else 'Athens'
            
            # Determine incident type
            incident_type = 'INCIDENT'
            if any(word in text.lower() for word in ['κλοπή', 'theft']):
                incident_type = 'THEFT'
            elif any(word in text.lower() for word in ['ληστεία', 'robbery']):
                incident_type = 'ROBBERY'
            elif any(word in text.lower() for word in ['επίθεση', 'assault']):
                incident_type = 'ASSAULT'
            
            lat, lon = self._get_athens_coordinates(location)
            
            return {
                'ObjectID': len(self.scraped_data) + 1,
                'CFSDate': f"{date_str} 12:00",
                'IncidentType': incident_type,
                'Neighborhood': location,
                'Longitude': lon,
                'Latitude': lat
            }
            
        except Exception as e:
            print(f"   Error scraping article {url}: {e}")
            return None
    
    def _convert_manual_record(self, record: Dict) -> Dict[str, Any]:
        """Convert manual data record to our format"""
        try:
            return {
                'ObjectID': record.get('id', len(self.scraped_data) + 1),
                'CFSDate': record.get('date', datetime.now().isoformat()),
                'IncidentType': record.get('type', 'INCIDENT'),
                'Neighborhood': record.get('location', 'Athens'),
                'Longitude': float(record.get('longitude', 23.7348)),
                'Latitude': float(record.get('latitude', 37.9755))
            }
        except Exception as e:
            print(f"   Error converting manual record: {e}")
            return None
    
    def _convert_csv_record(self, row: pd.Series) -> Dict[str, Any]:
        """Convert CSV row to our format"""
        try:
            return {
                'ObjectID': row.get('id', len(self.scraped_data) + 1),
                'CFSDate': row.get('date', datetime.now().isoformat()),
                'IncidentType': row.get('type', 'INCIDENT'),
                'Neighborhood': row.get('location', 'Athens'),
                'Longitude': float(row.get('longitude', 23.7348)),
                'Latitude': float(row.get('latitude', 37.9755))
            }
        except Exception as e:
            print(f"   Error converting CSV record: {e}")
            return None
    
    def _get_athens_coordinates(self, location: str) -> tuple:
        """Get approximate coordinates for Athens location"""
        # Simple mapping of common Athens areas
        athens_areas = {
            'syntagma': (37.9755, 23.7348),
            'monastiraki': (37.9760, 23.7280),
            'plaka': (37.9750, 23.7300),
            'psiri': (37.9800, 23.7200),
            'thissio': (37.9700, 23.7200),
            'kallithea': (37.9600, 23.7000),
            'neos kosmos': (37.9600, 23.7400),
            'koukaki': (37.9700, 23.7300),
            'acropolis': (37.9715, 23.7267),
            'athens': (37.9755, 23.7348)
        }
        
        location_lower = location.lower()
        for area, coords in athens_areas.items():
            if area in location_lower:
                return coords
        
        # Default to Athens center with some random variation
        import random
        lat = 37.9755 + random.uniform(-0.05, 0.05)
        lon = 23.7348 + random.uniform(-0.05, 0.05)
        return (lat, lon)
    
    def generate_sample_data(self, num_records: int = 1000):
        """Generate sample crime data for testing"""
        print(f"Generating {num_records} sample records...")
        
        import random
        
        incident_types = ['THEFT', 'ROBBERY', 'ASSAULT', 'BURGLARY', 'VANDALISM', 'TRAFFIC VIOLATION']
        neighborhoods = ['Syntagma', 'Monastiraki', 'Plaka', 'Psiri', 'Thissio', 'Kallithea', 'Neos Kosmos', 'Koukaki']
        
        for i in range(num_records):
            # Random date in the last year
            days_ago = random.randint(0, 365)
            incident_date = datetime.now() - timedelta(days=days_ago)
            
            # Random time
            hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            incident_datetime = incident_date.replace(hour=hour, minute=minute)
            
            # Random location
            neighborhood = random.choice(neighborhoods)
            lat, lon = self._get_athens_coordinates(neighborhood)
            
            # Add some random variation
            lat += random.uniform(-0.01, 0.01)
            lon += random.uniform(-0.01, 0.01)
            
            self.scraped_data.append({
                'ObjectID': i + 1,
                'CFSDate': incident_datetime.strftime('%Y-%m-%d %H:%M:%S'),
                'IncidentType': random.choice(incident_types),
                'Neighborhood': neighborhood,
                'Longitude': round(lon, 6),
                'Latitude': round(lat, 6)
            })
        
        print(f"   Generated {len(self.scraped_data)} sample records")
    
    def save_to_csv(self, filename: str = 'athens_crime_data.csv'):
        """Save scraped data to CSV file"""
        if not self.scraped_data:
            print("No data to save!")
            return False
        
        try:
            df = pd.DataFrame(self.scraped_data)
            df.to_csv(filename, index=False)
            print(f"Saved {len(self.scraped_data)} records to {filename}")
            return True
        except Exception as e:
            print(f"Error saving CSV: {e}")
            return False
    
    def print_summary(self):
        """Print summary of scraped data"""
        if not self.scraped_data:
            print("No data scraped!")
            return
        
        print(f"\nSCRAPED DATA SUMMARY")
        print("=" * 40)
        print(f"Total records: {len(self.scraped_data)}")
        
        # Incident type distribution
        incident_types = [record['IncidentType'] for record in self.scraped_data]
        type_counts = pd.Series(incident_types).value_counts()
        print(f"\nIncident types:")
        for incident_type, count in type_counts.items():
            print(f"  {incident_type}: {count}")
        
        # Date range
        dates = [record['CFSDate'] for record in self.scraped_data]
        if dates:
            print(f"\nDate range: {min(dates)} to {max(dates)}")
        
        # Geographic coverage
        lats = [record['Latitude'] for record in self.scraped_data]
        lons = [record['Longitude'] for record in self.scraped_data]
        if lats and lons:
            print(f"Latitude range: {min(lats):.6f} to {max(lats):.6f}")
            print(f"Longitude range: {min(lons):.6f} to {max(lons):.6f}")

def main():
    parser = argparse.ArgumentParser(description='Athens Crime Data Scraper')
    parser.add_argument('--sources', nargs='+', help='URLs to scrape from')
    parser.add_argument('--manual', help='Path to manual data file (JSON/CSV)')
    parser.add_argument('--sample', type=int, help='Generate N sample records')
    parser.add_argument('--output', default='athens_crime_data.csv', help='Output CSV filename')
    parser.add_argument('--max-pages', type=int, default=10, help='Max pages to scrape')
    
    args = parser.parse_args()
    
    scraper = AthensCrimeScraper()
    
    print("🚀 Starting Athens Crime Data Scraper")
    print("=" * 50)
    
    # Generate sample data if requested
    if args.sample:
        scraper.generate_sample_data(args.sample)
    
    # Scrape from manual data file
    if args.manual:
        scraper.scrape_manual_data(args.manual)
    
    # Scrape from provided URLs
    if args.sources:
        for source in args.sources:
            if 'police' in source.lower():
                scraper.scrape_greek_police_data(source, args.max_pages)
            elif 'data' in source.lower():
                scraper.scrape_open_data_portal(source, 'crime-data')
            else:
                scraper.scrape_news_sources([source])
    
    # If no sources provided, generate sample data
    if not args.sources and not args.manual and not args.sample:
        print("⚠️  No sources provided. Generating sample data...")
        scraper.generate_sample_data(1000)
    
    # Save and summarize
    scraper.save_to_csv(args.output)
    scraper.print_summary()
    
    print(f"\n🎉 Scraping complete! Data saved to {args.output}")
    print("📋 Next steps:")
    print("   1. Review the generated CSV file")
    print("   2. Run: python crime_data_processor.py")
    print("   3. Start the Flask server: python app.py")

if __name__ == "__main__":
    main()
