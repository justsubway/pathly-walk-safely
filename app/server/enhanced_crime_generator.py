#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enhanced Athens Crime Data Generator
Generates highly realistic crime data with proper safety ratings for dangerous areas
Based on real-world crime statistics and local knowledge
"""

import csv
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

class EnhancedAthensCrimeGenerator:
    def __init__(self):
        # Athens neighborhoods with realistic safety ratings and crime patterns
        self.athens_neighborhoods = {
            # HIGH DANGER AREAS (Safety Score: 20-40)
            'Omonia': {
                'lat': 37.9800, 'lng': 23.7300, 'district': 'Athens',
                'safety_score': 25, 'crime_multiplier': 3.5, 'night_danger': 0.9,
                'common_crimes': ['Robbery', 'Drugs', 'Assault', 'Theft'],
                'description': 'High crime area, drug trafficking, avoid at night'
            },
            'Victoria': {
                'lat': 37.9900, 'lng': 23.7300, 'district': 'Athens',
                'safety_score': 30, 'crime_multiplier': 3.0, 'night_danger': 0.85,
                'common_crimes': ['Robbery', 'Assault', 'Theft', 'Drugs'],
                'description': 'Dangerous area, frequent robberies and assaults'
            },
            'Menidi': {
                'lat': 38.0400, 'lng': 23.7000, 'district': 'Athens',
                'safety_score': 20, 'crime_multiplier': 4.0, 'night_danger': 0.95,
                'common_crimes': ['Assault', 'Robbery', 'Drugs', 'Vandalism'],
                'description': 'Very dangerous area, high crime rates, avoid completely'
            },
            'Exarchia': {
                'lat': 37.9800, 'lng': 23.7200, 'district': 'Athens',
                'safety_score': 35, 'crime_multiplier': 2.8, 'night_danger': 0.8,
                'common_crimes': ['Assault', 'Vandalism', 'Public Disorder', 'Drugs'],
                'description': 'Anarchist area, frequent clashes, avoid during protests'
            },
            'Metaxourgio': {
                'lat': 37.9750, 'lng': 23.7200, 'district': 'Athens',
                'safety_score': 40, 'crime_multiplier': 2.5, 'night_danger': 0.75,
                'common_crimes': ['Theft', 'Robbery', 'Drugs', 'Assault'],
                'description': 'Rising crime area, drug activity, be cautious'
            },
            'Psiri': {
                'lat': 37.9780, 'lng': 23.7250, 'district': 'Athens',
                'safety_score': 45, 'crime_multiplier': 2.2, 'night_danger': 0.7,
                'common_crimes': ['Theft', 'Assault', 'Public Disorder', 'Drugs'],
                'description': 'Nightlife area, pickpocketing, bar fights'
            },
            
            # MEDIUM DANGER AREAS (Safety Score: 40-70)
            'Patissia': {
                'lat': 37.9900, 'lng': 23.7100, 'district': 'Athens',
                'safety_score': 55, 'crime_multiplier': 1.8, 'night_danger': 0.6,
                'common_crimes': ['Theft', 'Vandalism', 'Public Disorder'],
                'description': 'Mixed residential area, some crime, be alert'
            },
            'Kipseli': {
                'lat': 37.9850, 'lng': 23.7200, 'district': 'Athens',
                'safety_score': 60, 'crime_multiplier': 1.5, 'night_danger': 0.5,
                'common_crimes': ['Theft', 'Vandalism', 'Fraud'],
                'description': 'Dense residential area, moderate safety'
            },
            'Ampelokipi': {
                'lat': 37.9800, 'lng': 23.7500, 'district': 'Athens',
                'safety_score': 65, 'crime_multiplier': 1.3, 'night_danger': 0.4,
                'common_crimes': ['Theft', 'Fraud', 'Vandalism'],
                'description': 'Business district, generally safe, some petty crime'
            },
            'Kallithea': {
                'lat': 37.9600, 'lng': 23.7000, 'district': 'Athens',
                'safety_score': 70, 'crime_multiplier': 1.2, 'night_danger': 0.3,
                'common_crimes': ['Theft', 'Fraud'],
                'description': 'Mixed area, generally safe, some pickpocketing'
            },
            
            # SAFER AREAS (Safety Score: 70-90)
            'Syntagma': {
                'lat': 37.9755, 'lng': 23.7348, 'district': 'Athens',
                'safety_score': 75, 'crime_multiplier': 1.0, 'night_danger': 0.2,
                'common_crimes': ['Theft', 'Fraud'],
                'description': 'Tourist area, police presence, pickpocketing risk'
            },
            'Monastiraki': {
                'lat': 37.9750, 'lng': 23.7350, 'district': 'Athens',
                'safety_score': 80, 'crime_multiplier': 0.9, 'night_danger': 0.15,
                'common_crimes': ['Theft'],
                'description': 'Tourist area, generally safe, watch for pickpockets'
            },
            'Plaka': {
                'lat': 37.9750, 'lng': 23.7300, 'district': 'Athens',
                'safety_score': 85, 'crime_multiplier': 0.8, 'night_danger': 0.1,
                'common_crimes': ['Theft'],
                'description': 'Historic tourist area, very safe, some pickpocketing'
            },
            'Acropolis': {
                'lat': 37.9700, 'lng': 23.7400, 'district': 'Athens',
                'safety_score': 90, 'crime_multiplier': 0.7, 'night_danger': 0.05,
                'common_crimes': ['Theft'],
                'description': 'Tourist area, police presence, very safe'
            },
            'Kolonaki': {
                'lat': 37.9850, 'lng': 23.7300, 'district': 'Athens',
                'safety_score': 88, 'crime_multiplier': 0.6, 'night_danger': 0.1,
                'common_crimes': ['Theft', 'Fraud'],
                'description': 'Upscale area, very safe, some luxury theft'
            },
            'Gazi': {
                'lat': 37.9750, 'lng': 23.7200, 'district': 'Athens',
                'safety_score': 82, 'crime_multiplier': 0.8, 'night_danger': 0.2,
                'common_crimes': ['Theft', 'Public Disorder'],
                'description': 'Nightlife area, generally safe, some bar incidents'
            },
            'Kerameikos': {
                'lat': 37.9780, 'lng': 23.7150, 'district': 'Athens',
                'safety_score': 78, 'crime_multiplier': 0.9, 'night_danger': 0.25,
                'common_crimes': ['Theft', 'Vandalism'],
                'description': 'Mixed area, generally safe, some petty crime'
            },
            'Nea Smyrni': {
                'lat': 37.9600, 'lng': 23.7500, 'district': 'Athens',
                'safety_score': 85, 'crime_multiplier': 0.7, 'night_danger': 0.1,
                'common_crimes': ['Theft', 'Fraud'],
                'description': 'Residential area, very safe, minimal crime'
            },
            'Zografou': {
                'lat': 37.9700, 'lng': 23.7800, 'district': 'Athens',
                'safety_score': 87, 'crime_multiplier': 0.6, 'night_danger': 0.08,
                'common_crimes': ['Theft'],
                'description': 'University area, very safe, some petty theft'
            },
            'Kaisariani': {
                'lat': 37.9600, 'lng': 23.7600, 'district': 'Athens',
                'safety_score': 83, 'crime_multiplier': 0.8, 'night_danger': 0.15,
                'common_crimes': ['Theft', 'Vandalism'],
                'description': 'Residential area, safe, some minor crime'
            },
            'Vyronas': {
                'lat': 37.9600, 'lng': 23.7400, 'district': 'Athens',
                'safety_score': 80, 'crime_multiplier': 0.9, 'night_danger': 0.2,
                'common_crimes': ['Theft', 'Vandalism'],
                'description': 'Mixed residential area, generally safe'
            },
            'Dafni': {
                'lat': 37.9500, 'lng': 23.7300, 'district': 'Athens',
                'safety_score': 85, 'crime_multiplier': 0.7, 'night_danger': 0.1,
                'common_crimes': ['Theft'],
                'description': 'Residential area, very safe, minimal crime'
            },
            'Haidari': {
                'lat': 38.0100, 'lng': 23.6500, 'district': 'Athens',
                'safety_score': 75, 'crime_multiplier': 1.0, 'night_danger': 0.3,
                'common_crimes': ['Theft', 'Vandalism', 'Public Disorder'],
                'description': 'Mixed area, moderate safety, some crime'
            },
            'Peristeri': {
                'lat': 38.0200, 'lng': 23.7000, 'district': 'Athens',
                'safety_score': 70, 'crime_multiplier': 1.2, 'night_danger': 0.4,
                'common_crimes': ['Theft', 'Vandalism', 'Assault'],
                'description': 'Working class area, moderate safety'
            },
            'Aigaleo': {
                'lat': 37.9900, 'lng': 23.6800, 'district': 'Athens',
                'safety_score': 65, 'crime_multiplier': 1.4, 'night_danger': 0.5,
                'common_crimes': ['Theft', 'Assault', 'Vandalism'],
                'description': 'Mixed area, some crime, be cautious'
            },
            'Ilion': {
                'lat': 38.0300, 'lng': 23.7200, 'district': 'Athens',
                'safety_score': 68, 'crime_multiplier': 1.3, 'night_danger': 0.45,
                'common_crimes': ['Theft', 'Vandalism', 'Assault'],
                'description': 'Residential area, moderate safety'
            },
            'Agia Paraskevi': {
                'lat': 37.9900, 'lng': 23.8200, 'district': 'Athens',
                'safety_score': 88, 'crime_multiplier': 0.6, 'night_danger': 0.05,
                'common_crimes': ['Theft'],
                'description': 'Upscale residential area, very safe'
            },
            'Chalandri': {
                'lat': 38.0200, 'lng': 23.8000, 'district': 'Athens',
                'safety_score': 90, 'crime_multiplier': 0.5, 'night_danger': 0.03,
                'common_crimes': ['Theft'],
                'description': 'Affluent area, very safe, minimal crime'
            }
        }
        
        # Enhanced crime types with more realistic patterns
        self.crime_types = {
            'Theft': {
                'subtypes': ['Petty Theft', 'Burglary', 'Vehicle Theft', 'Pickpocketing', 'Shoplifting', 'Bicycle Theft', 'Bag Snatching'],
                'severity': ['Low', 'Medium'],
                'weapon_used': ['None'],
                'arrest_rate': 0.25,
                'weight': 0.35,
                'time_patterns': {'day': 0.6, 'evening': 0.3, 'night': 0.1}
            },
            'Assault': {
                'subtypes': ['Simple Assault', 'Aggravated Assault', 'Domestic Violence', 'Bar Fight', 'Street Fight', 'Gang Violence'],
                'severity': ['Medium', 'High'],
                'weapon_used': ['None', 'Knife', 'Blunt Object', 'Fist'],
                'arrest_rate': 0.65,
                'weight': 0.20,
                'time_patterns': {'day': 0.2, 'evening': 0.4, 'night': 0.4}
            },
            'Robbery': {
                'subtypes': ['Street Robbery', 'Armed Robbery', 'Snatch and Grab', 'Mugging', 'Store Robbery', 'ATM Robbery'],
                'severity': ['Medium', 'High'],
                'weapon_used': ['None', 'Knife', 'Gun', 'Blunt Object'],
                'arrest_rate': 0.40,
                'weight': 0.15,
                'time_patterns': {'day': 0.1, 'evening': 0.4, 'night': 0.5}
            },
            'Vandalism': {
                'subtypes': ['Property Damage', 'Graffiti', 'Window Breaking', 'Car Vandalism', 'Public Property Damage', 'Arson'],
                'severity': ['Low', 'Medium'],
                'weapon_used': ['None', 'Spray Paint', 'Lighter'],
                'arrest_rate': 0.10,
                'weight': 0.12,
                'time_patterns': {'day': 0.1, 'evening': 0.2, 'night': 0.7}
            },
            'Drugs': {
                'subtypes': ['Drug Possession', 'Drug Dealing', 'Drug Use', 'Cannabis Possession', 'Drug Trafficking', 'Drug Lab'],
                'severity': ['Low', 'Medium', 'High'],
                'weapon_used': ['None'],
                'arrest_rate': 0.75,
                'weight': 0.08,
                'time_patterns': {'day': 0.3, 'evening': 0.4, 'night': 0.3}
            },
            'Fraud': {
                'subtypes': ['Identity Theft', 'Credit Card Fraud', 'Online Scam', 'Forgery', 'ATM Fraud', 'Insurance Fraud'],
                'severity': ['Medium'],
                'weapon_used': ['None'],
                'arrest_rate': 0.20,
                'weight': 0.07,
                'time_patterns': {'day': 0.8, 'evening': 0.2, 'night': 0.0}
            },
            'Public Disorder': {
                'subtypes': ['Public Intoxication', 'Disturbing Peace', 'Trespassing', 'Noise Violation', 'Public Nuisance', 'Rioting'],
                'severity': ['Low', 'Medium'],
                'weapon_used': ['None'],
                'arrest_rate': 0.50,
                'weight': 0.03,
                'time_patterns': {'day': 0.2, 'evening': 0.3, 'night': 0.5}
            }
        }

    def generate_enhanced_crime_data(self, num_records: int = 3000) -> List[Dict[str, Any]]:
        """Generate highly realistic crime data with proper safety ratings"""
        crimes = []
        
        print(f"🔍 Generating {num_records} enhanced crime records...")
        
        for i in range(num_records):
            # Random date within last 2 years
            start_date = datetime.now() - timedelta(days=730)
            random_days = random.randint(0, 730)
            crime_date = start_date + timedelta(days=random_days)
            
            # Select neighborhood based on crime probability
            neighborhood = self._select_neighborhood_by_crime_rate()
            coords = self.athens_neighborhoods[neighborhood]
            
            # Add realistic coordinate variation
            lat = coords['lat'] + random.uniform(-0.003, 0.003)
            lng = coords['lng'] + random.uniform(-0.003, 0.003)
            
            # Select crime type based on neighborhood patterns
            crime_type = self._select_crime_type_for_neighborhood(neighborhood)
            crime_info = self.crime_types[crime_type]
            
            # Generate time based on crime type and neighborhood patterns
            hour = self._generate_realistic_hour(crime_type, neighborhood)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            
            crime_time = crime_date.replace(hour=hour, minute=minute, second=second)
            
            # Generate incident details
            subtype = random.choice(crime_info['subtypes'])
            severity = self._determine_severity(crime_type, neighborhood, hour)
            weapon = self._select_weapon(crime_type, severity)
            arrest_made = self._determine_arrest(crime_type, neighborhood, severity)
            
            # Generate realistic description
            description = self._generate_enhanced_description(crime_type, subtype, neighborhood, severity)
            
            # Generate case details
            case_number = f"ATH-{crime_date.year}-{random.randint(1000, 9999)}"
            officer_id = f"OFF{random.randint(100, 999)}"
            status = self._determine_status(arrest_made, severity)
            
            # Generate victim count based on crime type
            victim_count = self._generate_victim_count(crime_type, severity)
            
            # Generate additional context
            context = self._generate_context(neighborhood, crime_type, hour)
            
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
                'status': status,
                'context': context,
                'safety_rating': coords['safety_score'],
                'area_danger_level': self._get_danger_level(coords['safety_score'])
            }
            
            crimes.append(crime)
            
            if (i + 1) % 300 == 0:
                print(f"   Generated {i + 1}/{num_records} records...")
        
        return crimes

    def _select_neighborhood_by_crime_rate(self) -> str:
        """Select neighborhood based on crime rate (dangerous areas more likely)"""
        neighborhoods = list(self.athens_neighborhoods.keys())
        weights = []
        
        for neighborhood in neighborhoods:
            # Higher crime multiplier = higher weight
            weight = self.athens_neighborhoods[neighborhood]['crime_multiplier']
            weights.append(weight)
        
        # Normalize weights
        total_weight = sum(weights)
        normalized_weights = [w / total_weight for w in weights]
        
        return random.choices(neighborhoods, weights=normalized_weights)[0]

    def _select_crime_type_for_neighborhood(self, neighborhood: str) -> str:
        """Select crime type based on neighborhood's common crimes"""
        common_crimes = self.athens_neighborhoods[neighborhood]['common_crimes']
        
        # 70% chance to select from common crimes, 30% chance for any crime
        if random.random() < 0.7:
            return random.choice(common_crimes)
        else:
            return self._select_crime_type_by_weight()

    def _select_crime_type_by_weight(self) -> str:
        """Select crime type based on weights"""
        rand = random.random()
        cumulative = 0
        for crime_type, info in self.crime_types.items():
            cumulative += info['weight']
            if rand <= cumulative:
                return crime_type
        return 'Theft'

    def _generate_realistic_hour(self, crime_type: str, neighborhood: str) -> int:
        """Generate realistic hour based on crime type and neighborhood patterns"""
        pattern = self.crime_types[crime_type]['time_patterns']
        neighborhood_info = self.athens_neighborhoods[neighborhood]
        
        # Adjust for neighborhood night danger
        night_adjustment = neighborhood_info['night_danger']
        
        # 60% chance to use crime type patterns, 40% chance for neighborhood patterns
        if random.random() < 0.6:
            if random.random() < pattern['night'] * night_adjustment:
                night_hours = list(range(20, 24)) + list(range(0, 7))
                return random.choice(night_hours)
            elif random.random() < pattern['evening']:
                return random.randint(17, 23)
            else:
                return random.randint(7, 16)
        else:
            # Neighborhood-specific patterns
            if random.random() < neighborhood_info['night_danger']:
                night_hours = list(range(20, 24)) + list(range(0, 7))
                return random.choice(night_hours)
            else:
                return random.randint(7, 19)

    def _determine_severity(self, crime_type: str, neighborhood: str, hour: int) -> str:
        """Determine crime severity based on multiple factors"""
        base_severity = random.choice(self.crime_types[crime_type]['severity'])
        neighborhood_info = self.athens_neighborhoods[neighborhood]
        
        # Night crimes are more severe
        if hour >= 20 or hour <= 6:
            if base_severity == 'Low':
                return 'Medium' if random.random() < 0.3 else 'Low'
            elif base_severity == 'Medium':
                return 'High' if random.random() < 0.4 else 'Medium'
        
        # Dangerous areas have higher severity
        if neighborhood_info['safety_score'] < 50:
            if base_severity == 'Low':
                return 'Medium' if random.random() < 0.5 else 'Low'
            elif base_severity == 'Medium':
                return 'High' if random.random() < 0.3 else 'Medium'
        
        return base_severity

    def _select_weapon(self, crime_type: str, severity: str) -> str:
        """Select weapon based on crime type and severity"""
        weapons = self.crime_types[crime_type]['weapon_used']
        
        # Higher severity = more likely to use weapon
        if severity == 'High':
            return random.choice(weapons) if weapons else 'None'
        elif severity == 'Medium':
            return 'None' if random.random() < 0.7 else random.choice(weapons)
        else:
            return 'None'

    def _determine_arrest(self, crime_type: str, neighborhood: str, severity: str) -> bool:
        """Determine if arrest was made"""
        base_rate = self.crime_types[crime_type]['arrest_rate']
        neighborhood_info = self.athens_neighborhoods[neighborhood]
        
        # Adjust arrest rate based on neighborhood safety
        if neighborhood_info['safety_score'] < 50:
            base_rate *= 0.8  # Lower arrest rate in dangerous areas
        
        # Higher severity = higher arrest rate
        if severity == 'High':
            base_rate *= 1.3
        elif severity == 'Medium':
            base_rate *= 1.1
        
        return random.random() < base_rate

    def _determine_status(self, arrest_made: bool, severity: str) -> str:
        """Determine case status"""
        if arrest_made:
            return 'Closed' if random.random() < 0.8 else 'Open'
        else:
            if severity == 'High':
                return 'Open' if random.random() < 0.9 else 'Closed'
            else:
                return 'Open' if random.random() < 0.6 else 'Closed'

    def _generate_victim_count(self, crime_type: str, severity: str) -> int:
        """Generate victim count based on crime type and severity"""
        if crime_type in ['Assault', 'Robbery']:
            if severity == 'High':
                return random.randint(1, 4)
            else:
                return random.randint(0, 2)
        else:
            return random.randint(0, 1)

    def _generate_context(self, neighborhood: str, crime_type: str, hour: int) -> str:
        """Generate additional context for the crime"""
        contexts = {
            'Omonia': ['Near metro station', 'In crowded square', 'At bus stop', 'Near drug dealing area'],
            'Victoria': ['In residential building', 'On main street', 'Near park', 'At intersection'],
            'Menidi': ['In abandoned building', 'On side street', 'Near industrial area', 'In housing complex'],
            'Exarchia': ['During protest', 'Near university', 'In anarchist area', 'At bar'],
            'Metaxourgio': ['Near train station', 'In commercial area', 'At intersection', 'Near park'],
            'Psiri': ['At bar', 'In nightlife area', 'Near restaurant', 'On pedestrian street']
        }
        
        if neighborhood in contexts:
            return random.choice(contexts[neighborhood])
        else:
            return 'In residential area'

    def _get_danger_level(self, safety_score: int) -> str:
        """Get danger level based on safety score"""
        if safety_score < 40:
            return 'Very High'
        elif safety_score < 60:
            return 'High'
        elif safety_score < 80:
            return 'Medium'
        else:
            return 'Low'

    def _generate_enhanced_description(self, crime_type: str, subtype: str, neighborhood: str, severity: str) -> str:
        """Generate enhanced crime description with more detail"""
        descriptions = {
            'Theft': {
                'Petty Theft': [
                    f'Pickpocketing incident in {neighborhood} - victim lost wallet with cash and cards',
                    f'Bag snatching in {neighborhood} - perpetrator grabbed purse and fled',
                    f'Mobile phone theft in {neighborhood} - stolen from victim\'s hand',
                    f'Bicycle theft in {neighborhood} - bike stolen from bike rack',
                    f'Shoplifting in {neighborhood} store - items worth €50 stolen'
                ],
                'Burglary': [
                    f'Residential burglary in {neighborhood} - apartment broken into, electronics stolen',
                    f'Home invasion in {neighborhood} - suspects entered through window',
                    f'Property burglary in {neighborhood} - tools and valuables stolen',
                    f'Apartment theft in {neighborhood} - door forced open, jewelry taken'
                ],
                'Vehicle Theft': [
                    f'Car theft in {neighborhood} - vehicle stolen from parking lot',
                    f'Motorcycle theft in {neighborhood} - bike taken from street',
                    f'Vehicle break-in in {neighborhood} - items stolen from car',
                    f'Bicycle theft in {neighborhood} - bike stolen from bike rack'
                ]
            },
            'Assault': {
                'Simple Assault': [
                    f'Physical altercation in {neighborhood} bar - two men fought over dispute',
                    f'Street fight in {neighborhood} - altercation between pedestrians',
                    f'Bar fight in {neighborhood} - patrons involved in brawl',
                    f'Domestic dispute in {neighborhood} - neighbors called police'
                ],
                'Aggravated Assault': [
                    f'Serious assault in {neighborhood} - victim injured with weapon',
                    f'Violent attack in {neighborhood} - victim hospitalized with injuries',
                    f'Weapon assault in {neighborhood} - knife used in attack',
                    f'Gang violence in {neighborhood} - multiple suspects involved'
                ]
            },
            'Robbery': {
                'Street Robbery': [
                    f'Street robbery in {neighborhood} - victim threatened and robbed',
                    f'Mugging in {neighborhood} - pedestrian robbed at knifepoint',
                    f'Snatch and grab in {neighborhood} - bag stolen from victim',
                    f'ATM robbery in {neighborhood} - victim robbed while withdrawing cash'
                ],
                'Armed Robbery': [
                    f'Armed robbery in {neighborhood} store - gun used in hold-up',
                    f'Weapon robbery in {neighborhood} - knife used to threaten victim',
                    f'Armed hold-up in {neighborhood} - multiple suspects with weapons',
                    f'Store robbery in {neighborhood} - cash register emptied at gunpoint'
                ]
            },
            'Drugs': {
                'Drug Possession': [
                    f'Drug possession arrest in {neighborhood} - cannabis found on suspect',
                    f'Drug dealing in {neighborhood} - suspect caught selling drugs',
                    f'Drug use in {neighborhood} - person found using substances',
                    f'Drug trafficking in {neighborhood} - large quantity of drugs seized'
                ]
            },
            'Vandalism': {
                'Property Damage': [
                    f'Graffiti vandalism in {neighborhood} - buildings spray-painted',
                    f'Window breaking in {neighborhood} - store windows smashed',
                    f'Car vandalism in {neighborhood} - vehicles scratched and damaged',
                    f'Property destruction in {neighborhood} - public property damaged'
                ]
            }
        }
        
        if crime_type in descriptions and subtype in descriptions[crime_type]:
            return random.choice(descriptions[crime_type][subtype])
        else:
            return f'{subtype} incident in {neighborhood} - {severity.lower()} severity'

    def _get_specific_location(self, neighborhood: str) -> str:
        """Get specific location within neighborhood"""
        locations = {
            'Omonia': ['Omonia Square', 'Omonia Metro Station', 'Athinas Street', 'Panepistimiou Street'],
            'Victoria': ['Victoria Square', 'Victoria Metro Station', 'Acharnon Street', 'Victoria Park'],
            'Menidi': ['Menidi Square', 'Menidi Metro Station', 'Industrial Area', 'Housing Complex'],
            'Exarchia': ['Exarchia Square', 'Stournari Street', 'Kallidromiou', 'Anarchist Area'],
            'Metaxourgio': ['Metaxourgio Metro', 'Pireos Street', 'Metaxourgio Square', 'Industrial Area'],
            'Psiri': ['Psiri District', 'Iroon Square', 'Agiou Dimitriou', 'Nightlife Area'],
            'Syntagma': ['Syntagma Square', 'Parliament Building', 'Ermou Street', 'Vasilissis Amalias'],
            'Monastiraki': ['Monastiraki Square', 'Flea Market', 'Adrianou Street', 'Pandrosou Street'],
            'Plaka': ['Plaka District', 'Anafiotika', 'Mnisikleous Street', 'Kydathineon Street'],
            'Acropolis': ['Acropolis Hill', 'Dionysiou Areopagitou', 'Makriyanni', 'Acropolis Museum'],
            'Kolonaki': ['Kolonaki Square', 'Voukourestiou Street', 'Skoufa Street', 'Ploutarchou Street']
        }
        
        if neighborhood in locations:
            return random.choice(locations[neighborhood])
        else:
            return f'{neighborhood} Area'

    def save_to_csv(self, crimes: List[Dict[str, Any]], filename: str = 'enhanced_athens_crime_data.csv'):
        """Save enhanced crime data to CSV file"""
        if not crimes:
            print("❌ No crime data to save")
            return
        
        fieldnames = [
            'date', 'time', 'datetime', 'latitude', 'longitude', 'incident_type',
            'offense', 'description', 'location', 'neighborhood', 'district',
            'severity', 'weapon_used', 'arrest_made', 'victim_count',
            'officer_id', 'case_number', 'status', 'context', 'safety_rating', 'area_danger_level'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(crimes)
        
        print(f"✅ Saved {len(crimes)} enhanced crime records to {filename}")

    def generate_and_save(self, num_records: int = 3000):
        """Generate and save enhanced crime data"""
        print("🚀 Enhanced Athens Crime Data Generator")
        print("=" * 50)
        print("📍 Including realistic safety ratings for dangerous areas")
        print("⚠️  Omonia, Victoria, Menidi marked as high-danger")
        print("=" * 50)
        
        # Generate crime data
        crimes = self.generate_enhanced_crime_data(num_records)
        
        # Save to CSV
        self.save_to_csv(crimes)
        
        # Generate summary statistics
        self._print_enhanced_summary(crimes)
        
        return crimes

    def _print_enhanced_summary(self, crimes: List[Dict[str, Any]]):
        """Print enhanced summary statistics"""
        print("\n📊 Enhanced Crime Data Summary")
        print("=" * 40)
        
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
        
        # Count by danger level
        danger_counts = {}
        for crime in crimes:
            danger_level = crime['area_danger_level']
            danger_counts[danger_level] = danger_counts.get(danger_level, 0) + 1
        
        print("\nArea Danger Levels:")
        for danger_level, count in sorted(danger_counts.items()):
            percentage = (count / len(crimes)) * 100
            print(f"  {danger_level}: {count} ({percentage:.1f}%)")
        
        # Top dangerous neighborhoods
        neighborhood_counts = {}
        for crime in crimes:
            neighborhood = crime['neighborhood']
            neighborhood_counts[neighborhood] = neighborhood_counts.get(neighborhood, 0) + 1
        
        print("\nTop 15 Neighborhoods by Crime Count:")
        sorted_neighborhoods = sorted(neighborhood_counts.items(), key=lambda x: x[1], reverse=True)
        for neighborhood, count in sorted_neighborhoods[:15]:
            percentage = (count / len(crimes)) * 100
            safety_score = self.athens_neighborhoods[neighborhood]['safety_score']
            print(f"  {neighborhood}: {count} ({percentage:.1f}%) - Safety: {safety_score}")
        
        # Arrest rate
        arrests = sum(1 for crime in crimes if crime['arrest_made'] == 'Yes')
        arrest_rate = (arrests / len(crimes)) * 100
        print(f"\nArrest Rate: {arrest_rate:.1f}% ({arrests}/{len(crimes)})")

if __name__ == "__main__":
    generator = EnhancedAthensCrimeGenerator()
    
    # Generate 3000 enhanced crime records
    crimes = generator.generate_and_save(3000)
    
    print(f"\n🎉 Successfully generated {len(crimes)} enhanced crime records!")
    print("📁 File saved as: enhanced_athens_crime_data.csv")
    print("🤖 Ready for AI training with realistic safety ratings!")
