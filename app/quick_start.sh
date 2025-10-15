#!/bin/bash

echo "🚀 Pathly App - Quick Start"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if setup has been done
if [ ! -d "server/venv" ] || [ ! -d "node_modules" ]; then
    echo "⚠️  Setup not detected. Please run './setup_and_run.sh' first for complete setup."
    exit 1
fi

print_status "Starting Pathly App (assuming setup is complete)..."

# Make sure start script is executable
chmod +x start_app.sh

# Start the application
./start_app.sh

print_success "Pathly App started!"
echo ""
echo "🌐 Backend API: http://localhost:5002"
echo "📱 Frontend: Check the Expo terminal for QR code"

