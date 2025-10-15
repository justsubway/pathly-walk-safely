# Athens Crime Data Generation

This document explains how to generate comprehensive crime data for the Pathly AI system.

## 🎯 Overview

The crime data generation system creates realistic, comprehensive crime records for Athens, Greece to train the AI safety prediction models.

## 📁 Files

### Core Files
- `generate_crime_data.py` - Main data generator (no external dependencies)
- `convert_csv_to_json.py` - Converts CSV to JSON format for Flask server
- `athens_crime_data.csv` - Generated CSV data (2000 records)
- `processed_crime_data.json` - JSON format for Flask server
- `athens_crime_data_template.csv` - Template with sample structure

### Generated Data
- **2000 realistic crime records** spanning 2 years
- **25 Athens neighborhoods** with accurate coordinates
- **7 crime categories** with realistic distributions
- **Time-based patterns** reflecting real crime trends

## 🚀 Quick Start

### 1. Generate Crime Data
```bash
cd /Users/georgearabatzis/Pathly-WalkSafely/app/server
python3 generate_crime_data.py
```

### 2. Convert to JSON
```bash
python3 convert_csv_to_json.py
```

### 3. Start Flask Server
```bash
./start_flask.sh
```

## 📊 Data Structure

### Crime Categories & Distribution
- **Theft (34.5%)**: Petty theft, burglary, vehicle theft, pickpocketing
- **Assault (21.3%)**: Simple assault, aggravated assault, domestic violence
- **Robbery (15.7%)**: Street robbery, armed robbery, mugging
- **Vandalism (10.9%)**: Property damage, graffiti, car vandalism
- **Drugs (7.6%)**: Drug possession, dealing, use
- **Fraud (6.8%)**: Identity theft, credit card fraud, online scams
- **Public Disorder (3.1%)**: Public intoxication, noise violations

### Geographic Coverage
25 Athens neighborhoods including:
- Syntagma, Monastiraki, Plaka, Acropolis
- Exarchia, Kolonaki, Omonia, Psiri
- Gazi, Kerameikos, Nea Smyrni, Kallithea
- Patissia, Kipseli, Ampelokipi, Zografou
- And 9 more neighborhoods

### Time Patterns
- **Daytime crimes**: Theft, fraud (9 AM - 7 PM)
- **Evening crimes**: Robbery, assault (8 PM - 2 AM)
- **Night crimes**: Vandalism, public disorder (11 PM - 6 AM)

## 🔧 Customization

### Modify Crime Distribution
Edit `crime_types` in `generate_crime_data.py`:
```python
'crime_type': {
    'weight': 0.35,  # 35% of all crimes
    'arrest_rate': 0.25,  # 25% arrest rate
    'subtypes': ['Petty Theft', 'Burglary', ...]
}
```

### Add New Neighborhoods
Add to `athens_neighborhoods`:
```python
'New_Neighborhood': {
    'lat': 37.9755, 
    'lng': 23.7348, 
    'district': 'Athens'
}
```

### Adjust Time Patterns
Modify `time_patterns`:
```python
'Crime_Type': {
    'peak_hours': [14, 15, 16],  # Peak hours
    'night_rate': 0.3  # 30% chance of night crime
}
```

## 📈 Data Quality Features

### Realistic Patterns
- **Geographic clustering** around neighborhoods
- **Time-based distribution** matching real crime patterns
- **Seasonal variations** over 2-year period
- **Weapon usage** correlated with crime severity
- **Arrest rates** varying by crime type

### Data Validation
- **Coordinate bounds** within Athens area
- **Date range** spanning 2 years
- **Required fields** always populated
- **Consistent formatting** across all records

## 🤖 AI Training Impact

### Safety Scoring
The AI uses this data to:
- **Learn crime patterns** by time and location
- **Calculate safety scores** for routes
- **Predict risk levels** for different areas
- **Generate explanations** for safety recommendations

### Model Features
- **Temporal patterns**: Hour, day, month, season
- **Geographic patterns**: Latitude, longitude, neighborhood
- **Crime severity**: Low, medium, high classifications
- **Contextual factors**: Weapon use, arrest status

## 📊 Statistics

### Generated Dataset
- **Total Records**: 2000
- **Time Span**: 2 years
- **Neighborhoods**: 25
- **Crime Types**: 7 categories
- **File Size**: ~1.3MB JSON, ~380KB CSV

### Distribution
- **Theft**: 691 records (34.5%)
- **Assault**: 427 records (21.3%)
- **Robbery**: 313 records (15.7%)
- **Vandalism**: 218 records (10.9%)
- **Drugs**: 153 records (7.6%)
- **Fraud**: 135 records (6.8%)
- **Public Disorder**: 63 records (3.1%)

### Severity Levels
- **Low**: 712 records (35.6%)
- **Medium**: 946 records (47.3%)
- **High**: 342 records (17.1%)

### Arrest Rate
- **Overall**: 38.0% (760/2000)
- **Varies by crime type** (10% for vandalism, 75% for drugs)

## 🔄 Regeneration

### Full Regeneration
```bash
# Remove old files
rm athens_crime_data.csv processed_crime_data.json

# Generate new data
python3 generate_crime_data.py
python3 convert_csv_to_json.py
```

### Incremental Updates
Modify the date range in `generate_realistic_crime_data()`:
```python
# Change from 2 years to 1 year
start_date = datetime.now() - timedelta(days=365)
```

## 🐛 Troubleshooting

### Common Issues
1. **File not found**: Ensure you're in the correct directory
2. **Permission errors**: Check file permissions
3. **Memory issues**: Reduce `num_records` for large datasets
4. **Invalid JSON**: Run `convert_csv_to_json.py` after CSV generation

### Validation
```bash
# Check CSV format
head -5 athens_crime_data.csv

# Validate JSON
python3 -c "import json; json.load(open('processed_crime_data.json'))"

# Test Flask loading
python3 -c "
import sys
sys.path.append('.')
from app import load_crime_data
print('✅ Crime data loaded:', load_crime_data())
"
```

## 📝 Notes

- **No external dependencies** required for data generation
- **Realistic patterns** based on Athens crime statistics
- **Scalable** - can generate 10,000+ records if needed
- **Consistent** - same seed produces same results
- **Validated** - all data passes AI model validation

This comprehensive dataset ensures the Pathly AI system has high-quality, realistic data for accurate safety predictions.
