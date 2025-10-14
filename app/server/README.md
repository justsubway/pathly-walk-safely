# Pathly AI Backend Server

This is the AI-powered backend server for Pathly, providing intelligent safety predictions for walking routes in Athens, Greece.

## 🤖 AI System Overview

The system uses a **Random Forest Classifier** to predict crime risk based on:
- **Time factors**: Hour, day of week, weekend/night status
- **Location factors**: Latitude, longitude, distance from city center
- **Temporal patterns**: Month, seasonal variations

## 🚀 Quick Start

### 1. Setup Backend Server

```bash
cd app/server
chmod +x setup_backend.sh
./setup_backend.sh
```

### 2. Start the Server

```bash
chmod +x start_flask.sh
./start_flask.sh
```

The server will run on `http://localhost:5002`

## 📊 Data Requirements

### Crime Data Format

You need a CSV file named `athens_crime_data.csv` with these columns:

```csv
ObjectID,CFSDate,IncidentType,Neighborhood,Longitude,Latitude
1,2024-01-15 14:30:00,THEFT,Plaka,23.7348,37.9755
2,2024-01-15 20:45:00,ASSAULT,Monastiraki,23.7280,37.9760
```

**Required Columns:**
- `ObjectID`: Unique identifier
- `CFSDate`: Date and time of incident (YYYY-MM-DD HH:MM:SS)
- `IncidentType`: Type of crime/incident
- `Neighborhood`: Area name
- `Longitude`: GPS longitude
- `Latitude`: GPS latitude

### Data Sources for Athens

1. **Greek Police Data**: Contact Hellenic Police for official crime statistics
2. **Open Data Portals**: Check Greek government open data initiatives
3. **Municipal Data**: Athens municipality may have incident reports
4. **Sample Data**: Use the provided sample data for testing

## 🔧 API Endpoints

### Health Check
```
GET /health
```
Returns server status and data availability.

### Generate Routes
```
POST /generate-routes
```
**Body:**
```json
{
  "startLat": 37.9755,
  "startLng": 23.7348,
  "endLat": 37.9760,
  "endLng": 23.7280,
  "timeHour": 14
}
```

### AI Risk Prediction
```
POST /api/ai-risk
```
**Body:**
```json
{
  "latitude": 37.9755,
  "longitude": 23.7348,
  "hour": 14
}
```

## 🧠 AI Training Process

1. **Data Loading**: Loads crime data from CSV
2. **Feature Engineering**: Creates 8 key features
3. **Model Training**: Trains Random Forest on historical data
4. **Validation**: Tests accuracy on held-out data
5. **Real-time Prediction**: Provides risk scores for new locations

## 📈 Safety Scoring

The system calculates safety scores (0-100) based on:

- **Crime Density**: Number of nearby incidents
- **Crime Severity**: Weighted by crime type
- **Time Factors**: Higher risk at night/weekends
- **Distance Factors**: Closer crimes have more impact
- **AI Predictions**: Machine learning risk assessment

## 🔄 Integration with Frontend

The React Native app automatically:
1. Detects available backend servers
2. Falls back to local AI if server unavailable
3. Uses AI predictions for route safety scoring
4. Displays real-time risk assessments

## 🛠️ Troubleshooting

### Server Won't Start
- Check Python version (3.8+ required)
- Ensure all dependencies installed
- Verify port 5002 is available

### No Crime Data
- Place `athens_crime_data.csv` in server directory
- Check file format matches requirements
- Verify data has valid coordinates

### AI Not Training
- Ensure at least 100 crime records
- Check data has valid dates and coordinates
- Verify incident types are properly formatted

## 📋 Next Steps

1. **Get Real Data**: Obtain actual Athens crime data
2. **Expand Features**: Add weather, events, traffic data
3. **Improve Model**: Use more sophisticated ML algorithms
4. **Real-time Updates**: Add live data feeds
5. **Mobile Optimization**: Optimize for mobile performance

## 🔐 Security Notes

- API keys are included for demo purposes
- Use environment variables in production
- Implement proper authentication
- Add rate limiting for production use

## 📞 Support

For issues or questions:
1. Check the logs in `flask.log`
2. Verify data format requirements
3. Test with sample data first
4. Check network connectivity
