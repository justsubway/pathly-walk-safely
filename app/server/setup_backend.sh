#!/bin/bash

echo "🚀 Setting up Pathly AI Backend Server"
echo "======================================"

# Create virtual environment
echo "📦 Creating Python virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Create sample crime data if it doesn't exist
if [ ! -f "athens_crime_data.csv" ]; then
    echo "📊 Creating sample Athens crime data..."
    echo "ObjectID,CFSDate,IncidentType,Neighborhood,Longitude,Latitude" > athens_crime_data.csv
    echo "1,2024-01-15 14:30:00,THEFT,Plaka,23.7348,37.9755" >> athens_crime_data.csv
    echo "2,2024-01-15 20:45:00,ASSAULT,Monastiraki,23.7280,37.9760" >> athens_crime_data.csv
    echo "3,2024-01-16 10:15:00,TRAFFIC VIOLATION,Syntagma,23.7310,37.9750" >> athens_crime_data.csv
    echo "4,2024-01-16 22:30:00,ROBBERY,Psiri,23.7200,37.9800" >> athens_crime_data.csv
    echo "5,2024-01-17 16:20:00,COMMUNITY CONTACT,Thissio,23.7200,37.9700" >> athens_crime_data.csv
    echo "✅ Sample crime data created"
fi

# Process crime data
echo "🧠 Processing crime data for AI training..."
python crime_data_processor.py

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "🚀 To start the server:"
echo "   cd server"
echo "   source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "   python app.py"
echo ""
echo "🌐 Server will run on: http://localhost:5002"
echo "📊 Health check: http://localhost:5002/health"
