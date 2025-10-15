#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert Enhanced CSV crime data to JSON format for Flask server
"""

import csv
import json
from datetime import datetime

def convert_enhanced_csv_to_json(csv_file: str, json_file: str):
    """Convert enhanced CSV crime data to JSON format expected by Flask server"""
    
    crimes = []
    
    print(f"📖 Reading enhanced CSV file: {csv_file}")
    
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
                'status': row['status'],
                'context': row['context'],
                'safety_rating': int(row['safety_rating']),
                'area_danger_level': row['area_danger_level']
            }
            
            crimes.append(crime)
    
    # Create JSON structure expected by Flask server
    json_data = {
        'incidents': crimes,
        'metadata': {
            'total_incidents': len(crimes),
            'generated_at': datetime.now().isoformat(),
            'source': 'enhanced_athens_crime_data.csv',
            'enhanced_features': [
                'realistic_safety_ratings',
                'dangerous_area_marking',
                'contextual_descriptions',
                'weapon_usage_patterns',
                'arrest_rate_variations'
            ]
        }
    }
    
    print(f"💾 Writing enhanced JSON file: {json_file}")
    
    with open(json_file, 'w', encoding='utf-8') as jsonfile:
        json.dump(json_data, jsonfile, indent=2, ensure_ascii=False)
    
    print(f"✅ Converted {len(crimes)} enhanced crime records to JSON")
    print(f"📁 JSON file saved as: {json_file}")
    
    # Print safety rating summary
    safety_ratings = {}
    danger_levels = {}
    
    for crime in crimes:
        rating = crime['safety_rating']
        danger = crime['area_danger_level']
        
        safety_ratings[rating] = safety_ratings.get(rating, 0) + 1
        danger_levels[danger] = danger_levels.get(danger, 0) + 1
    
    print(f"\n📊 Safety Rating Distribution:")
    for rating in sorted(safety_ratings.keys()):
        count = safety_ratings[rating]
        percentage = (count / len(crimes)) * 100
        print(f"  Safety {rating}: {count} records ({percentage:.1f}%)")
    
    print(f"\n⚠️  Danger Level Distribution:")
    for level in ['Very High', 'High', 'Medium', 'Low']:
        count = danger_levels.get(level, 0)
        percentage = (count / len(crimes)) * 100
        print(f"  {level}: {count} records ({percentage:.1f}%)")
    
    return len(crimes)

if __name__ == "__main__":
    # Convert enhanced CSV to JSON
    num_records = convert_enhanced_csv_to_json('enhanced_athens_crime_data.csv', 'processed_crime_data.json')
    
    print(f"\n🎉 Successfully converted {num_records} enhanced records!")
    print("🤖 Ready for Flask server with realistic safety ratings!")
    print("⚠️  Dangerous areas (Omonia, Victoria, Menidi) properly marked!")
