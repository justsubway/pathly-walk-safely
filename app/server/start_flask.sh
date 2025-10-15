#!/bin/bash

echo "🚀 Starting Pathly AI Backend Server"
echo "===================================="

# Load environment variables if a .env file exists (root or app dir)
if [ -f "../.env" ]; then
  echo "🔧 Loading env from ../.env"
  set -a
  # shellcheck disable=SC1091
  source ../.env
  set +a
elif [ -f "./.env" ]; then
  echo "🔧 Loading env from ./.env"
  set -a
  # shellcheck disable=SC1091
  source ./.env
  set +a
fi

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start Flask server
echo "🌐 Starting Flask server on port 5002..."
python app.py
