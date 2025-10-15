#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Athens Crime Data Generator
Generates comprehensive realistic crime data for Pathly AI training
No external dependencies required
"""

import csv
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

class AthensCrimeDataGenerator:
    def __init__(self):
        # Athens neighborhoods and their coordinates
        self.athens_neighborhoods = {
            'Syntagma': {'lat': 37.9755, 'lng': 23.7348, 'district': 'Athens'},
            'Monastiraki': {'lat': 37.9750, 'lng': 23.7350, 'district': 'Athens'},
            'Plaka': {'lat': 37.9750, 'lng': 23.7300, 'district': 'Athens'},
            'Acropolis': {'lat': 37.9700, 'lng': 23.7400, 'district': 'Athens'},
            'Exarchia': {'lat': 37.9800, 'lng': 23.7200, 'district': 'Athens'},
            'Kolonaki': {'lat': 37.9850, 'lng': 23.7300, 'district': 'Athens'},
            'Omonia': {'lat': 37.9800, 'lng': 23.7300, 'district': 'Athens'},
            'Psiri': {'lat': 37.9780, 'lng': 23.7250, 'district': 'Athens'},
            'Gazi': {'lat': 37.9750, 'lng': 23.7200, 'district': 'Athens'},
            'Kerameikos': {'lat': 37.9780, 'lng': 23.7150, 'district': 'Athens'},
            'Nea Smyrni': {'lat': 37.9600, 'lng': 23.7500, 'district': 'Athens'},
            'Kallithea': {'lat': 37.9600, 'lng': 23.7000, 'district': 'Athens'},
            'Patissia': {'lat': 37.9900, 'lng': 23.7100, 'district': 'Athens'},
            'Kipseli': {'lat': 37.9850, 'lng': 23.7200, 'district': 'Athens'},
            'Ampelokipi': {'lat': 37.9800, 'lng': 23.7500, 'district': 'Athens'},
            'Zografou': {'lat': 37.9700, 'lng': 23.7800, 'district': 'Athens'},
            'Kaisariani': {'lat': 37.9600, 'lng': 23.7600, 'district': 'Athens'},
            'Vyronas': {'lat': 37.9600, 'lng': 23.7400, 'district': 'Athens'},
            'Dafni': {'lat': 37.9500, 'lng': 23.7300, 'district': 'Athens'},
            'Haidari': {'lat': 38.0100, 'lng': 23.6500, 'district': 'Athens'},
            'Peristeri': {'lat': 38.0200, 'lng': 23.7000, 'district': 'Athens'},
            'Aigaleo': {'lat': 37.9900, 'lng': 23.6800, 'district': 'Athens'},
            'Ilion': {'lat': 38.0300, 'lng': 23.7200, 'district': 'Athens'},
            'Agia Paraskevi': {'lat': 37.9900, 'lng': 23.8200, 'district': 'Athens'},
            'Chalandri': {'lat': 38.0200, 'lng': 23.8000, 'district': 'Athens'}
        }
        
        # Crime types and their characteristics
        self.crime_types = {
            'Theft': {
                'subtypes': ['Petty Theft', 'Burglary', 'Vehicle Theft', 'Pickpocketing', 'Shoplifting', 'Bicycle Theft'],
                'severity': ['Low', 'Medium'],
                'weapon_used': ['None'],
                'arrest_rate': 0.25,
                'weight': 0.35
            },
            'Assault': {
                'subtypes': ['Simple Assault', 'Aggravated Assault', 'Domestic Violence', 'Bar Fight', 'Street Fight'],
                'severity': ['Medium', 'High'],
                'weapon_used': ['None', 'Knife', 'Blunt Object'],
                'arrest_rate': 0.65,
                'weight': 0.20
            },
            'Robbery': {
                'subtypes': ['Street Robbery', 'Armed Robbery', 'Snatch and Grab', 'Mugging', 'Store Robbery'],
                'severity': ['Medium', 'High'],
                'weapon_used': ['None', 'Knife', 'Gun'],
                'arrest_rate': 0.40,
                'weight': 0.15
            },
            'Vandalism': {
                'subtypes': ['Property Damage', 'Graffiti', 'Window Breaking', 'Car Vandalism', 'Public Property Damage'],
                'severity': ['Low'],
                'weapon_used': ['None'],
                'arrest_rate': 0.10,
                'weight': 0.12
            },
            'Drugs': {
                'subtypes': ['Drug Possession', 'Drug Dealing', 'Drug Use', 'Cannabis Possession'],
                'severity': ['Low', 'Medium'],
                'weapon_used': ['None'],
                'arrest_rate': 0.75,
                'weight': 0.08
            },
            'Fraud': {
                'subtypes': ['Identity Theft', 'Credit Card Fraud', 'Online Scam', 'Forgery', 'ATM Fraud'],
                'severity': ['Medium'],
                'weapon_used': ['None'],
                'arrest_rate': 0.20,
                'weight': 0.07
            },
            'Public Disorder': {
                'subtypes': ['Public Intoxication', 'Disturbing Peace', 'Trespassing', 'Noise Violation', 'Public Nuisance'],
                'severity': ['Low'],
                'weapon_used': ['None'],
                'arrest_rate': 0.50,
                'weight': 0.03
            }
        }
        
        # Time patterns for different crime types
        self.time_patterns = {
            'Theft': {'peak_hours': [14, 15, 16, 20, 21, 22], 'night_rate': 0.3},
            'Assault': {'peak_hours': [22, 23, 0, 1, 2, 3], 'night_rate': 0.8},
            'Robbery': {'peak_hours': [20, 21, 22, 23, 0, 1], 'night_rate': 0.7},
            'Vandalism': {'peak_hours': [23, 0, 1, 2, 3, 4], 'night_rate': 0.9},
            'Drugs': {'peak_hours': [20, 21, 22, 23, 0, 1], 'night_rate': 0.6},
            'Fraud': {'peak_hours': [9, 10, 11, 14, 15, 16], 'night_rate': 0.1},
            'Public Disorder': {'peak_hours': [22, 23, 0, 1, 2, 3], 'night_rate': 0.8}
        }

    def generate_realistic_crime_data(self, num_records: int = 2000) -> List[Dict[str, Any]]:
        """Generate realistic crime data based on Athens patterns"""
        crimes = []
        
        print(f"🔍 Generating {num_records} realistic crime records...")
        
        for i in range(num_records):
            # Random date within last 2 years
            start_date = datetime.now() - timedelta(days=730)
            random_days = random.randint(0, 730)
            crime_date = start_date + timedelta(days=random_days)
            
            # Select crime type based on realistic distribution
            crime_type = self._select_crime_type()
            crime_info = self.crime_types[crime_type]
            
            # Select neighborhood
            neighborhood = random.choice(list(self.athens_neighborhoods.keys()))
            coords = self.athens_neighborhoods[neighborhood]
            
            # Add some randomness to coordinates
            lat = coords['lat'] + random.uniform(-0.005, 0.005)
            lng = coords['lng'] + random.uniform(-0.005, 0.005)
            
            # Generate time based on crime type patterns
            hour = self._generate_realistic_hour(crime_type)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            
            crime_time = crime_date.replace(hour=hour, minute=minute, second=second)
            
            # Generate incident details
            subtype = random.choice(crime_info['subtypes'])
            severity = random.choice(crime_info['severity'])
            weapon = random.choice(crime_info['weapon_used'])
            arrest_made = random.random() < crime_info['arrest_rate']
            
            # Generate description
            description = self._generate_description(crime_type, subtype, neighborhood)
            
            # Generate case details
            case_number = f"ATH-{crime_date.year}-{random.randint(1000, 9999)}"
            officer_id = f"OFF{random.randint(100, 999)}"
            status = random.choice(['Open', 'Closed']) if not arrest_made else 'Closed'
            
            # Generate victim count
            victim_count = random.randint(0, 3) if crime_type in ['Assault', 'Robbery'] else random.randint(0, 1)
            
            crime = {
                'date': crime_date.strftime('%Y-%m-%d'),
                'time': crime_time.strftime('%H:%M:%S'),
                'datetime': crime_time.strftime('%Y-%m-%d %H:%M:%S'),
                'latitude': round(lat, 6),
                'longitude': round(lng, 6),
                'incident_type': crime_type,
                'offense': subtype,
                'description': description,
                'location': self._get_specific_location(neighborhood),
                'neighborhood': neighborhood,
                'district': coords['district'],
                'severity': severity,
                'weapon_used': weapon,
                'arrest_made': 'Yes' if arrest_made else 'No',
                'victim_count': victim_count,
                'officer_id': officer_id,
                'case_number': case_number,
                'status': status
            }
            
            crimes.append(crime)
            
            if (i + 1) % 200 == 0:
                print(f"   Generated {i + 1}/{num_records} records...")
        
        return crimes

    def _select_crime_type(self) -> str:
        """Select crime type based on realistic distribution"""
        rand = random.random()
        cumulative = 0
        for crime_type, info in self.crime_types.items():
            cumulative += info['weight']
            if rand <= cumulative:
                return crime_type
        return 'Theft'

    def _generate_realistic_hour(self, crime_type: str) -> int:
        """Generate realistic hour based on crime type patterns"""
        pattern = self.time_patterns[crime_type]
        
        # 70% chance to use peak hours, 30% chance for random hour
        if random.random() < 0.7:
            return random.choice(pattern['peak_hours'])
        else:
            # Night crimes are more likely at night
            if random.random() < pattern['night_rate']:
                # Generate night hours (8 PM to 6 AM)
                night_hours = list(range(20, 24)) + list(range(0, 7))
                return random.choice(night_hours)
            else:
                return random.randint(7, 19)  # 7 AM to 7 PM

    def _generate_description(self, crime_type: str, subtype: str, neighborhood: str) -> str:
        """Generate realistic crime description"""
        descriptions = {
            'Theft': {
                'Petty Theft': [
                    f'Theft of personal belongings in {neighborhood}',
                    f'Pickpocketing incident near {neighborhood} metro station',
                    f'Theft of mobile phone in {neighborhood} area',
                    f'Bag snatching in {neighborhood}',
                    f'Wallet theft in {neighborhood}'
                ],
                'Burglary': [
                    f'Residential burglary in {neighborhood}',
                    f'Break-in at apartment in {neighborhood}',
                    f'Home invasion in {neighborhood} area',
                    f'Property burglary in {neighborhood}',
                    f'Apartment theft in {neighborhood}'
                ],
                'Vehicle Theft': [
                    f'Car theft from {neighborhood} parking lot',
                    f'Motorcycle theft in {neighborhood}',
                    f'Vehicle break-in in {neighborhood}',
                    f'Car vandalism and theft in {neighborhood}',
                    f'Bicycle theft in {neighborhood}'
                ],
                'Shoplifting': [
                    f'Shoplifting incident in {neighborhood} store',
                    f'Retail theft in {neighborhood}',
                    f'Store theft in {neighborhood}',
                    f'Shoplifting at {neighborhood} shop'
                ]
            },
            'Assault': {
                'Simple Assault': [
                    f'Physical altercation in {neighborhood} bar',
                    f'Fight between individuals in {neighborhood}',
                    f'Assault incident in {neighborhood} street',
                    f'Physical confrontation in {neighborhood}',
                    f'Brawl in {neighborhood} area'
                ],
                'Aggravated Assault': [
                    f'Serious assault with weapon in {neighborhood}',
                    f'Violent attack in {neighborhood} area',
                    f'Assault resulting in injury in {neighborhood}',
                    f'Weapon assault in {neighborhood}',
                    f'Violent confrontation in {neighborhood}'
                ],
                'Domestic Violence': [
                    f'Domestic violence incident in {neighborhood}',
                    f'Family dispute in {neighborhood}',
                    f'Domestic assault in {neighborhood}',
                    f'Spouse violence in {neighborhood}'
                ]
            },
            'Robbery': {
                'Street Robbery': [
                    f'Street robbery in {neighborhood}',
                    f'Mugging incident in {neighborhood}',
                    f'Snatch and grab theft in {neighborhood}',
                    f'Street crime in {neighborhood} area',
                    f'Pedestrian robbery in {neighborhood}'
                ],
                'Armed Robbery': [
                    f'Armed robbery at {neighborhood} store',
                    f'Weapon robbery in {neighborhood}',
                    f'Armed hold-up in {neighborhood}',
                    f'Gun robbery in {neighborhood} area',
                    f'Armed store robbery in {neighborhood}'
                ]
            },
            'Vandalism': {
                'Property Damage': [
                    f'Property vandalism in {neighborhood}',
                    f'Graffiti on building in {neighborhood}',
                    f'Window breaking in {neighborhood}',
                    f'Property destruction in {neighborhood}',
                    f'Building damage in {neighborhood}'
                ],
                'Car Vandalism': [
                    f'Car vandalism in {neighborhood}',
                    f'Vehicle damage in {neighborhood}',
                    f'Car scratching in {neighborhood}',
                    f'Vehicle vandalism in {neighborhood}'
                ]
            },
            'Drugs': {
                'Drug Possession': [
                    f'Drug possession arrest in {neighborhood}',
                    f'Cannabis possession in {neighborhood}',
                    f'Drug use in {neighborhood} area',
                    f'Substance possession in {neighborhood}',
                    f'Drug arrest in {neighborhood}'
                ],
                'Drug Dealing': [
                    f'Drug dealing in {neighborhood}',
                    f'Drug trafficking in {neighborhood}',
                    f'Substance dealing in {neighborhood}',
                    f'Drug sales in {neighborhood}'
                ]
            },
            'Fraud': {
                'Identity Theft': [
                    f'Identity theft case in {neighborhood}',
                    f'Credit card fraud in {neighborhood}',
                    f'Online scam in {neighborhood}',
                    f'Financial fraud in {neighborhood}',
                    f'Identity fraud in {neighborhood}'
                ],
                'ATM Fraud': [
                    f'ATM fraud in {neighborhood}',
                    f'Card skimming in {neighborhood}',
                    f'ATM theft in {neighborhood}',
                    f'Bank fraud in {neighborhood}'
                ]
            },
            'Public Disorder': {
                'Public Intoxication': [
                    f'Public intoxication in {neighborhood}',
                    f'Drunk and disorderly in {neighborhood}',
                    f'Public drunkenness in {neighborhood}',
                    f'Intoxication arrest in {neighborhood}'
                ],
                'Noise Violation': [
                    f'Noise complaint in {neighborhood}',
                    f'Loud music disturbance in {neighborhood}',
                    f'Noise violation in {neighborhood}',
                    f'Disturbance in {neighborhood}'
                ]
            }
        }
        
        if crime_type in descriptions and subtype in descriptions[crime_type]:
            return random.choice(descriptions[crime_type][subtype])
        else:
            return f'{subtype} incident in {neighborhood}'

    def _get_specific_location(self, neighborhood: str) -> str:
        """Get specific location within neighborhood"""
        locations = {
            'Syntagma': ['Syntagma Square', 'Parliament Building', 'Ermou Street', 'Vasilissis Amalias'],
            'Monastiraki': ['Monastiraki Square', 'Flea Market', 'Adrianou Street', 'Pandrosou Street'],
            'Plaka': ['Plaka District', 'Anafiotika', 'Mnisikleous Street', 'Kydathineon Street'],
            'Acropolis': ['Acropolis Hill', 'Dionysiou Areopagitou', 'Makriyanni', 'Acropolis Museum'],
            'Exarchia': ['Exarchia Square', 'Stournari Street', 'Kallidromiou', 'Zoodochou Pigis'],
            'Kolonaki': ['Kolonaki Square', 'Voukourestiou Street', 'Skoufa Street', 'Ploutarchou Street'],
            'Omonia': ['Omonia Square', 'Panepistimiou Street', 'Athinas Street', 'Stadiou Street'],
            'Psiri': ['Psiri District', 'Iroon Square', 'Agiou Dimitriou', 'Ermou Street'],
            'Gazi': ['Gazi District', 'Kerameikos Metro', 'Pireos Street', 'Technopolis'],
            'Kerameikos': ['Kerameikos Archaeological Site', 'Ermou Street', 'Pireos Street', 'Kerameikos Metro'],
            'Nea Smyrni': ['Nea Smyrni Square', 'Korai Square', 'Nea Smyrni Metro', 'Akti Miaouli'],
            'Kallithea': ['Kallithea Square', 'Kallithea Metro', 'Syngrou Avenue', 'Kallithea Beach'],
            'Patissia': ['Patissia Square', 'Patissia Metro', 'Acharnon Street', 'Patissia Park'],
            'Kipseli': ['Kipseli Square', 'Kipseli Metro', 'Kipselis Street', 'Kipseli Market'],
            'Ampelokipi': ['Ampelokipi Square', 'Ampelokipi Metro', 'Kifissias Avenue', 'Ampelokipi Park'],
            'Zografou': ['Zografou Square', 'Zografou Metro', 'Zografou Hill', 'Zografou Park'],
            'Kaisariani': ['Kaisariani Square', 'Kaisariani Metro', 'Kaisariani Hill', 'Kaisariani Monastery'],
            'Vyronas': ['Vyronas Square', 'Vyronas Metro', 'Vyronas Hill', 'Vyronas Park'],
            'Dafni': ['Dafni Square', 'Dafni Metro', 'Dafni Monastery', 'Dafni Park'],
            'Haidari': ['Haidari Square', 'Haidari Metro', 'Haidari Prison', 'Haidari Park'],
            'Peristeri': ['Peristeri Square', 'Peristeri Metro', 'Peristeri Stadium', 'Peristeri Market'],
            'Aigaleo': ['Aigaleo Square', 'Aigaleo Metro', 'Aigaleo Hill', 'Aigaleo Park'],
            'Ilion': ['Ilion Square', 'Ilion Metro', 'Ilion Stadium', 'Ilion Park'],
            'Agia Paraskevi': ['Agia Paraskevi Square', 'Agia Paraskevi Metro', 'Agia Paraskevi Hill', 'Agia Paraskevi Park'],
            'Chalandri': ['Chalandri Square', 'Chalandri Metro', 'Chalandri Hill', 'Chalandri Park']
        }
        
        if neighborhood in locations:
            return random.choice(locations[neighborhood])
        else:
            return f'{neighborhood} Area'

    def save_to_csv(self, crimes: List[Dict[str, Any]], filename: str = 'athens_crime_data.csv'):
        """Save crime data to CSV file"""
        if not crimes:
            print("❌ No crime data to save")
            return
        
        fieldnames = [
            'date', 'time', 'datetime', 'latitude', 'longitude', 'incident_type',
            'offense', 'description', 'location', 'neighborhood', 'district',
            'severity', 'weapon_used', 'arrest_made', 'victim_count',
            'officer_id', 'case_number', 'status'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(crimes)
        
        print(f"✅ Saved {len(crimes)} crime records to {filename}")

    def generate_and_save(self, num_records: int = 2000):
        """Generate and save comprehensive crime data"""
        print("🚀 Athens Crime Data Generator")
        print("=" * 40)
        
        # Generate crime data
        crimes = self.generate_realistic_crime_data(num_records)
        
        # Save to CSV
        self.save_to_csv(crimes)
        
        # Generate summary statistics
        self._print_summary(crimes)
        
        return crimes

    def _print_summary(self, crimes: List[Dict[str, Any]]):
        """Print summary statistics"""
        print("\n📊 Crime Data Summary")
        print("=" * 30)
        
        # Count by incident type
        incident_counts = {}
        for crime in crimes:
            incident_type = crime['incident_type']
            incident_counts[incident_type] = incident_counts.get(incident_type, 0) + 1
        
        print("Incident Types:")
        for incident_type, count in sorted(incident_counts.items()):
            percentage = (count / len(crimes)) * 100
            print(f"  {incident_type}: {count} ({percentage:.1f}%)")
        
        # Count by severity
        severity_counts = {}
        for crime in crimes:
            severity = crime['severity']
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        print("\nSeverity Levels:")
        for severity, count in sorted(severity_counts.items()):
            percentage = (count / len(crimes)) * 100
            print(f"  {severity}: {count} ({percentage:.1f}%)")
        
        # Count by neighborhood
        neighborhood_counts = {}
        for crime in crimes:
            neighborhood = crime['neighborhood']
            neighborhood_counts[neighborhood] = neighborhood_counts.get(neighborhood, 0) + 1
        
        print("\nTop 10 Neighborhoods:")
        sorted_neighborhoods = sorted(neighborhood_counts.items(), key=lambda x: x[1], reverse=True)
        for neighborhood, count in sorted_neighborhoods[:10]:
            percentage = (count / len(crimes)) * 100
            print(f"  {neighborhood}: {count} ({percentage:.1f}%)")
        
        # Arrest rate
        arrests = sum(1 for crime in crimes if crime['arrest_made'] == 'Yes')
        arrest_rate = (arrests / len(crimes)) * 100
        print(f"\nArrest Rate: {arrest_rate:.1f}% ({arrests}/{len(crimes)})")

if __name__ == "__main__":
    generator = AthensCrimeDataGenerator()
    
    # Generate 2000 realistic crime records
    crimes = generator.generate_and_save(2000)
    
    print(f"\n🎉 Successfully generated {len(crimes)} crime records!")
    print("📁 File saved as: athens_crime_data.csv")
    print("🤖 Ready for AI training!")
