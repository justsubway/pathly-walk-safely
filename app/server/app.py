# -*- coding: utf-8 -*-
"""
Pathly Flask API Backend
AI-powered safety prediction for Athens, Greece
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import pandas as pd
from datetime import datetime, timedelta
import math
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import requests
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native requests

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
        # Try to load from multiple possible locations
        possible_paths = [
            CRIME_DATA_PATH,
            "../processed_crime_data.json",
            "../assets/processed_crime_data.json"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    data = json.load(f)
                    
                    # Handle both formats: direct array or {incidents: [...]}
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
                    print("🤖 Training AI on Athens crime data...")
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
    
    # Create spatial grid (0.001 degree cells ~ 100m)
    spatial_grid = {}
    for incident in crime_data:
        # Handle both 'lat'/'lon' and 'latitude'/'longitude' field names
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
        
        # Generate routes using Google Maps API
        routes = generate_google_routes(start_lat, start_lng, end_lat, end_lng)
        
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
            'routes': scored_routes[:5],  # Return top 5 routes
            'total_generated': len(scored_routes)
        })
        
    except Exception as e:
        print(f"Route generation error: {e}")
        return jsonify({'error': str(e)}), 500

def generate_google_routes(start_lat, start_lng, end_lat, end_lng):
    """Generate routes using Google Directions API"""
    try:
        base_url = "https://maps.googleapis.com/maps/api/directions/json"
        
        routes = []
        
        # Generate multiple routes with different preferences
        alternatives = [
            {"avoid": "", "mode": "walking"},
            {"avoid": "highways", "mode": "walking"},
            {"avoid": "tolls", "mode": "walking"}
        ]
        
        for i, alt in enumerate(alternatives):
            params = {
                'origin': f"{start_lat},{start_lng}",
                'destination': f"{end_lat},{end_lng}",
                'mode': alt['mode'],
                'alternatives': 'true',
                'key': GOOGLE_MAPS_API_KEY
            }
            
            if alt['avoid']:
                params['avoid'] = alt['avoid']
            
            response = requests.get(base_url, params=params)
            data = response.json()
            
            if data.get('status') == 'OK':
                for j, route in enumerate(data.get('routes', [])):
                    route_coords = decode_polyline(route['overview_polyline']['points'])
                    distance_km = route['legs'][0]['distance']['value'] / 1000
                    duration_min = route['legs'][0]['duration']['value'] / 60
                    
                    routes.append({
                        'id': f"route_{i}_{j}",
                        'name': f"Route {len(routes) + 1}",
                        'coords': route_coords,
                        'distanceKm': round(distance_km, 2),
                        'etaMin': round(duration_min),
                        'safetyScore': 50  # Default, will be calculated later
                    })
        
        return routes
        
    except Exception as e:
        print(f"Google route error: {e}")
        return []

def decode_polyline(polyline_str):
    """Decode Google polyline to coordinates"""
    index = 0
    lat = 0
    lng = 0
    coordinates = []
    
    while index < len(polyline_str):
        # Decode latitude
        result = 1
        shift = 0
        while True:
            b = ord(polyline_str[index]) - 63 - 1
            index += 1
            result += (b & 0x1f) << shift
            shift += 5
            if b < 0x1f:
                break
        lat += (~result >> 1) if (result & 1) != 0 else (result >> 1)
        
        # Decode longitude
        result = 1
        shift = 0
        while True:
            b = ord(polyline_str[index]) - 63 - 1
            index += 1
            result += (b & 0x1f) << shift
            shift += 5
            if b < 0x1f:
                break
        lng += (~result >> 1) if (result & 1) != 0 else (result >> 1)
        
        coordinates.append({
            'latitude': lat / 1e5,
            'longitude': lng / 1e5
        })
    
    return coordinates

@app.route('/calculate-safety', methods=['POST'])
def calculate_safety_endpoint():
    """Calculate safety score for a route"""
    try:
        data = request.get_json()
        
        if not data or 'coords' not in data:
            return jsonify({'error': 'No route coordinates provided'}), 400
        
        coords = data['coords']
        time_hour = int(data.get('timeHour', 12))
        
        safety_score = calculate_route_safety(coords, time_hour)
        
        # Get AI risk prediction for route midpoint
        ai_risk_percentage = 30  # Default
        ai_explanation = "AI analysis unavailable"
        
        if coords and len(coords) > 0:
            # Use midpoint of route for AI prediction
            mid_idx = len(coords) // 2
            mid_coord = coords[mid_idx]
            ai_risk_percentage = get_ai_risk_prediction(
                mid_coord['latitude'], 
                mid_coord['longitude'], 
                time_hour
            )
            ai_explanation = get_ai_risk_explanation(ai_risk_percentage)

        return jsonify({
            'success': True,
            'safetyScore': safety_score,
            'aiRiskPercentage': ai_risk_percentage,
            'aiExplanation': ai_explanation,
            'timeHour': time_hour
        })
        
    except Exception as e:
        print(f"Safety calculation error: {e}")
        return jsonify({'error': str(e)}), 500

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
            nearby_crimes = get_nearby_crimes(lat, lng, radius=0.002)  # ~200m radius
            
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
                    distance = haversine_distance(lat, lng, crime['lat'], crime['lon'])
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
    distance = haversine_distance(lat1, lng1, crime['lat'], crime['lon'])
    
    # Risk decreases with distance
    if distance <= 0.0005:  # Very close (50m)
        return 1.0
    elif distance <= 0.001:  # Close (100m)
        return 0.7
    elif distance <= 0.002:  # Nearby (200m)
        return 0.4
    else:
        return 0.1

def haversine_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two points using Haversine formula"""
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
