#!/bin/bash

echo "🚀 Pathly App - Inline Mode (Backend + Frontend in same terminal)"
echo "================================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check if backend is already running
if port_in_use 5002; then
    print_warning "Backend already running on port 5002"
else
    print_status "Starting Backend Server..."
    cd server
    source venv/bin/activate
    python app.py &
    BACKEND_PID=$!
    cd ..
    print_success "Backend started (PID: $BACKEND_PID)"
fi

# Wait a moment for backend to initialize
print_status "Waiting for backend to initialize..."
sleep 3

# Check if frontend is already running
if port_in_use 3000; then
    print_warning "Frontend already running on port 3000"
else
    print_status "Starting Frontend (Expo)..."
    npm start &
    FRONTEND_PID=$!
    print_success "Frontend started (PID: $FRONTEND_PID)"
fi

echo ""
print_success "✅ Both services are running!"
echo ""
echo "🌐 Backend API: http://localhost:5002"
echo "📱 Frontend: Check the output above for QR code or press 'w' for web"
echo ""
echo "💡 Tips:"
echo "   - Scan the QR code with Expo Go app on your phone"
echo "   - Press 'w' in the terminal to open in web browser"
echo "   - The backend provides AI-powered safety predictions"
echo ""
echo "🛑 To stop: Press Ctrl+C (this will stop both services)"

# Function to cleanup on exit
cleanup() {
    echo ""
    print_status "Stopping services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_success "Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_success "Frontend stopped"
    fi
    print_success "All services stopped. Goodbye!"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
echo "Press Ctrl+C to stop all services..."
wait

