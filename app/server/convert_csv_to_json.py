#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert CSV crime data to JSON format for Flask server
"""

import csv
import json
from datetime import datetime

def convert_csv_to_json(csv_file: str, json_file: str):
    """Convert CSV crime data to JSON format expected by Flask server"""
    
    crimes = []
    
    print(f"📖 Reading CSV file: {csv_file}")
    
    with open(csv_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            # Convert CSV row to JSON format expected by Flask server
            crime = {
                'date': row['date'],
                'datetime': row['datetime'],
                'lat': float(row['latitude']),
                'lng': float(row['longitude']),
                'latitude': float(row['latitude']),
                'longitude': float(row['longitude']),
                'incident_type': row['incident_type'],
                'offense': row['offense'],
                'safety_category': row['incident_type'],  # Map incident_type to safety_category
                'description': row['description'],
                'location': row['location'],
                'neighborhood': row['neighborhood'],
                'district': row['district'],
                'severity': row['severity'],
                'weapon_used': row['weapon_used'],
                'arrest_made': row['arrest_made'],
                'victim_count': int(row['victim_count']),
                'officer_id': row['officer_id'],
                'case_number': row['case_number'],
                'status': row['status']
            }
            
            crimes.append(crime)
    
    # Create JSON structure expected by Flask server
    json_data = {
        'incidents': crimes,
        'metadata': {
            'total_incidents': len(crimes),
            'generated_at': datetime.now().isoformat(),
            'source': 'athens_crime_data.csv'
        }
    }
    
    print(f"💾 Writing JSON file: {json_file}")
    
    with open(json_file, 'w', encoding='utf-8') as jsonfile:
        json.dump(json_data, jsonfile, indent=2, ensure_ascii=False)
    
    print(f"✅ Converted {len(crimes)} crime records to JSON")
    print(f"📁 JSON file saved as: {json_file}")
    
    return len(crimes)

if __name__ == "__main__":
    # Convert CSV to JSON
    num_records = convert_csv_to_json('athens_crime_data.csv', 'processed_crime_data.json')
    
    print(f"\n🎉 Successfully converted {num_records} records!")
    print("🤖 Ready for Flask server!")
