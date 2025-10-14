# -*- coding: utf-8 -*-
"""
Simple Pathly Flask API Backend - No CORS
AI-powered safety prediction for Athens, Greece
"""

from flask import Flask, request, jsonify
import json
import pandas as pd
from datetime import datetime, timedelta
import math
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import requests
import os

app = Flask(__name__)

# Configuration
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', 'your_google_maps_api_key_here')
CRIME_DATA_PATH = "processed_crime_data.json"

# Global variables for cached data
crime_data = None
spatial_grid = {}

# AI Integration
try:
    from crime_ai import initialize_ai, get_ai_risk_prediction, get_ai_risk_explanation
    AI_AVAILABLE = True
    print("[AI] Athens Crime AI loaded successfully!")
except ImportError as e:
    AI_AVAILABLE = False
    print(f"[WARNING] Crime AI not available: {e}")
    
    # Fallback functions
    def get_ai_risk_prediction(lat, lng, hour=12):
        return 30  # Default risk
    def get_ai_risk_explanation(risk):
        return "AI not available"

@dataclass
class LatLng:
    latitude: float
    longitude: float

@dataclass
class RouteResult:
    id: str
    name: str
    coords: List[LatLng]
    distanceKm: float
    etaMin: int
    safetyScore: int

def load_crime_data():
    """Load and cache crime data"""
    global crime_data, spatial_grid
    
    if crime_data is not None:
        return True
    
    try:
        possible_paths = [
            CRIME_DATA_PATH,
            "../processed_crime_data.json",
            "../assets/processed_crime_data.json"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    data = json.load(f)
                    
                    if isinstance(data, dict) and 'incidents' in data:
                        crime_data = data['incidents']
                    elif isinstance(data, list):
                        crime_data = data
                    else:
                        print(f"Unexpected data format in {path}")
                        continue
                        
                print(f"Loaded {len(crime_data)} crime records from {path}")
                build_spatial_grid()
                
                # Initialize AI with crime data
                if AI_AVAILABLE:
                    print("Training AI on Athens crime data...")
                    initialize_ai(crime_data)
                
                return True
                
        print("Crime data file not found in any expected location")
        return False
        
    except Exception as e:
        print(f"Error loading crime data: {e}")
        return False

def build_spatial_grid():
    """Build spatial grid for crime data indexing"""
    global spatial_grid
    
    if not crime_data:
        return
    
    spatial_grid = {}
    for incident in crime_data:
        lat = incident.get('lat') or incident.get('latitude')
        lon = incident.get('lon') or incident.get('longitude')
        
        if lat and lon:
            lat_cell = round(float(lat), 3)
            lon_cell = round(float(lon), 3)
            cell_key = f"{lat_cell},{lon_cell}"
            
            if cell_key not in spatial_grid:
                spatial_grid[cell_key] = []
                
            spatial_grid[cell_key].append(incident)
    
    print(f"Spatial grid built: {len(spatial_grid)} cells")

@app.route('/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'Pathly Flask API',
        'crime_data_loaded': crime_data is not None,
        'crime_records': len(crime_data) if crime_data else 0,
        'spatial_cells': len(spatial_grid),
        'ai_available': AI_AVAILABLE
    })

@app.route('/generate-routes', methods=['POST'])
def generate_routes():
    """Generate safe routes endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Extract parameters
        start_lat = float(data.get('startLat', 0))
        start_lng = float(data.get('startLng', 0))
        end_lat = float(data.get('endLat', 0))
        end_lng = float(data.get('endLng', 0))
        time_hour = int(data.get('timeHour', 12))
        
        if not all([start_lat, start_lng, end_lat, end_lng]):
            return jsonify({'error': 'Missing required coordinates'}), 400
        
        # Generate sample routes for testing
        routes = generate_sample_routes(start_lat, start_lng, end_lat, end_lng)
        
        # Add safety scores
        scored_routes = []
        for route in routes:
            safety_score = calculate_route_safety(route['coords'], time_hour)
            route['safetyScore'] = safety_score
            scored_routes.append(route)
        
        # Sort by safety score (higher is safer)
        scored_routes = sorted(scored_routes, key=lambda x: x['safetyScore'], reverse=True)
        
        return jsonify({
            'success': True,
            'routes': scored_routes[:5],
            'total_generated': len(scored_routes)
        })
        
    except Exception as e:
        print(f"Route generation error: {e}")
        return jsonify({'error': str(e)}), 500

def generate_sample_routes(start_lat, start_lng, end_lat, end_lng):
    """Generate sample routes for testing"""
    routes = []
    
    # Generate 3 sample routes with different paths
    for i in range(3):
        # Create a simple route with waypoints
        coords = []
        
        # Start point
        coords.append({'latitude': start_lat, 'longitude': start_lng})
        
        # Add waypoints
        if i == 0:
            # Direct route
            coords.append({'latitude': (start_lat + end_lat) / 2, 'longitude': (start_lng + end_lng) / 2})
        elif i == 1:
            # Northern route
            mid_lat = (start_lat + end_lat) / 2 + 0.01
            mid_lng = (start_lng + end_lng) / 2
            coords.append({'latitude': mid_lat, 'longitude': mid_lng})
        else:
            # Southern route
            mid_lat = (start_lat + end_lat) / 2 - 0.01
            mid_lng = (start_lng + end_lng) / 2
            coords.append({'latitude': mid_lat, 'longitude': mid_lng})
        
        # End point
        coords.append({'latitude': end_lat, 'longitude': end_lng})
        
        # Calculate distance and time
        distance = calculate_distance(start_lat, start_lng, end_lat, end_lng)
        eta = int(distance * 12)  # Assume 5 km/h walking speed
        
        routes.append({
            'id': f"route_{i}",
            'name': f"Route {i + 1}",
            'coords': coords,
            'distanceKm': round(distance, 2),
            'etaMin': eta,
            'safetyScore': 50
        })
    
    return routes

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two points"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = (math.sin(delta_lat/2) * math.sin(delta_lat/2) + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lng/2) * math.sin(delta_lng/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

@app.route('/api/ai-risk', methods=['POST'])
def ai_risk_endpoint():
    """Get AI risk prediction for a location"""
    try:
        data = request.get_json()
        
        lat = float(data.get('latitude', 0))
        lng = float(data.get('longitude', 0))
        hour = int(data.get('hour', 12))
        
        if lat == 0 or lng == 0:
            return jsonify({'error': 'Invalid coordinates'}), 400
        
        # Get AI prediction
        risk_percentage = get_ai_risk_prediction(lat, lng, hour)
        explanation = get_ai_risk_explanation(risk_percentage)
        
        return jsonify({
            'success': True,
            'riskPercentage': risk_percentage,
            'explanation': explanation,
            'aiPowered': AI_AVAILABLE
        })
        
    except Exception as e:
        print(f"AI risk prediction error: {e}")
        return jsonify({'error': str(e)}), 500

def calculate_route_safety(coords, time_hour):
    """Calculate safety score for a route based on crime data"""
    if not crime_data or not coords:
        return 75  # Higher default score for Athens
    
    try:
        total_risk = 0
        segments_checked = 0
        
        # Check safety along route segments
        for i in range(len(coords) - 1):
            lat = coords[i]['latitude']
            lng = coords[i]['longitude']
            
            # Get nearby crime incidents
            nearby_crimes = get_nearby_crimes(lat, lng, radius=0.002)
            
            if nearby_crimes:
                # Calculate time-based risk multiplier
                time_multiplier = get_time_risk_multiplier(time_hour)
                
                # Calculate risk based on crime density and types
                segment_risk = 0
                for crime in nearby_crimes:
                    crime_weight = get_crime_weight(crime.get('incident_type', '') or crime.get('safety_category', ''))
                    distance_factor = calculate_distance_factor(lat, lng, crime)
                    segment_risk += crime_weight * distance_factor * time_multiplier
                
                total_risk += segment_risk
                segments_checked += 1
        
        if segments_checked == 0:
            return 88  # Higher baseline for no crimes
        
        # More optimistic conversion for Athens
        avg_risk = total_risk / segments_checked
        safety_score = max(35, min(100, 85 - (avg_risk * 3)))
        
        return round(safety_score)
        
    except Exception as e:
        print(f"Safety calculation error: {e}")
        return 75  # Higher default on error

def get_nearby_crimes(lat, lng, radius=0.002):
    """Get crimes within radius of a point"""
    if not spatial_grid:
        return []
    
    nearby_crimes = []
    
    # Check spatial grid cells within radius
    lat_cells = [round(lat + offset, 3) for offset in [-radius, 0, radius]]
    lng_cells = [round(lng + offset, 3) for offset in [-radius, 0, radius]]
    
    for lat_cell in lat_cells:
        for lng_cell in lng_cells:
            cell_key = f"{lat_cell},{lng_cell}"
            if cell_key in spatial_grid:
                for crime in spatial_grid[cell_key]:
                    distance = calculate_distance(lat, lng, crime['lat'], crime['lon'])
                    if distance <= radius:
                        nearby_crimes.append(crime)
    
    return nearby_crimes

def get_time_risk_multiplier(hour):
    """Get risk multiplier based on time of day"""
    if 22 <= hour or hour <= 5:
        return 1.4  # Higher risk late night
    elif 18 <= hour <= 21:
        return 1.2  # Medium risk evening  
    elif 6 <= hour <= 17:
        return 1.0  # Day time
    else:
        return 1.1  # Very gentle adjustment

def get_crime_weight(offense):
    """Get weight factor for different crime types"""
    offense_lower = offense.lower()
    
    if any(word in offense_lower for word in ['murder', 'homicide', 'assault']):
        return 10.0
    elif any(word in offense_lower for word in ['robbery', 'armed', 'weapon']):
        return 8.0
    elif any(word in offense_lower for word in ['theft', 'burglary', 'larceny']):
        return 5.0
    elif any(word in offense_lower for word in ['drug', 'narcotic']):
        return 3.0
    else:
        return 2.0

def calculate_distance_factor(lat1, lng1, crime):
    """Calculate distance-based risk factor"""
    distance = calculate_distance(lat1, lng1, crime['lat'], crime['lon'])
    
    # Risk decreases with distance
    if distance <= 0.0005:  # Very close (50m)
        return 1.0
    elif distance <= 0.001:  # Close (100m)
        return 0.7
    elif distance <= 0.002:  # Nearby (200m)
        return 0.4
    else:
        return 0.1

if __name__ == '__main__':
    print("Starting Pathly Flask API...")
    print(f"Google Maps API Key: {GOOGLE_MAPS_API_KEY[:10]}...")
    
    # Load crime data on startup
    if load_crime_data():
        print(f"Crime data loaded: {len(crime_data)} records")
        print(f"Spatial grid built: {len(spatial_grid)} cells")
    else:
        print("Crime data not loaded - will use fallback scores")
    
    app.run(host='0.0.0.0', port=5002, debug=True)
