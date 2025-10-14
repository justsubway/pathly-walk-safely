#!/bin/bash

echo "🚀 Starting Pathly AI Backend Server"
echo "===================================="

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start Flask server
echo "🌐 Starting Flask server on port 5002..."
python app.py
