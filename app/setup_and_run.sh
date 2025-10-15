#!/bin/bash

echo "🚀 Pathly Safe Walking App - Complete Setup & Run"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please run the appropriate script for your OS."
    exit 1
fi

print_status "Starting complete setup and run process..."

# Step 1: Check and install prerequisites
print_status "Step 1: Checking prerequisites..."

# Check for Homebrew
if ! command_exists brew; then
    print_warning "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [ $? -eq 0 ]; then
        print_success "Homebrew installed successfully"
    else
        print_error "Failed to install Homebrew. Please install manually from https://brew.sh"
        exit 1
    fi
else
    print_success "Homebrew found"
fi

# Check for Node.js
if ! command_exists node; then
    print_warning "Node.js not found. Installing Node.js..."
    brew install node
    if [ $? -eq 0 ]; then
        print_success "Node.js installed successfully"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
else
    print_success "Node.js found ($(node --version))"
fi

# Check for Python 3.11 (compatible with Flask)
if ! command_exists python3.11; then
    print_warning "Python 3.11 not found. Installing Python 3.11..."
    arch -arm64 brew install python@3.11
    if [ $? -eq 0 ]; then
        print_success "Python 3.11 installed successfully"
    else
        print_error "Failed to install Python 3.11"
        exit 1
    fi
else
    print_success "Python 3.11 found ($(python3.11 --version))"
fi

# Check for Expo CLI
if ! command_exists expo; then
    print_warning "Expo CLI not found. Installing Expo CLI..."
    npm install -g @expo/cli
    if [ $? -eq 0 ]; then
        print_success "Expo CLI installed successfully"
    else
        print_error "Failed to install Expo CLI"
        exit 1
    fi
else
    print_success "Expo CLI found"
fi

# Step 2: Set up backend
print_status "Step 2: Setting up Python backend..."

cd server

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment with Python 3.11..."
    /opt/homebrew/bin/python3.11 -m venv venv
    if [ $? -eq 0 ]; then
        print_success "Virtual environment created"
    else
        print_error "Failed to create virtual environment"
        exit 1
    fi
else
    print_success "Virtual environment already exists"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    print_success "Python dependencies installed"
else
    print_error "Failed to install Python dependencies"
    exit 1
fi

# Go back to app directory
cd ..

# Step 3: Set up frontend
print_status "Step 3: Setting up React Native frontend..."

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Node.js dependencies installed"
else
    print_error "Failed to install Node.js dependencies"
    exit 1
fi

# Step 4: Check for port conflicts
print_status "Step 4: Checking for port conflicts..."

if port_in_use 5002; then
    print_warning "Port 5002 is already in use. Backend might already be running."
fi

if port_in_use 3000; then
    print_warning "Port 3000 is already in use. Frontend might already be running."
fi

# Step 5: Start the application
print_status "Step 5: Starting the application..."

# Make the original start script executable
chmod +x start_app.sh

# Start the application using the existing script
print_status "Launching Pathly App..."
./start_app.sh

print_success "Setup complete! The application should now be running."
echo ""
echo "🌐 Backend API: http://localhost:5002"
echo "📱 Frontend: Check the Expo terminal for QR code or press 'w' for web"
echo ""
echo "🛑 To stop the application: Close the terminal windows or press Ctrl+C"
echo ""
echo "💡 Tips:"
echo "   - Scan the QR code with Expo Go app on your phone"
echo "   - Press 'w' in the Expo terminal to open in web browser"
echo "   - The backend provides AI-powered safety predictions"
echo "   - Frontend works even without backend (fallback mode)"
