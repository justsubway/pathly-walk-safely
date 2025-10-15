#!/bin/bash

echo "🚀 Pathly App - iTerm2 Optimized Launch"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Check if iTerm2 is available
if ! osascript -e 'tell application "iTerm2" to get version' >/dev/null 2>&1; then
    print_warning "iTerm2 not detected. Falling back to regular terminal launch..."
    ./start_app.sh
    exit 0
fi

print_status "Using iTerm2 for optimal experience..."

# Start backend in new iTerm2 window
print_status "Starting Backend Server in new iTerm2 window..."
osascript -e "tell application \"iTerm2\"
    create window with default profile
    tell current session of current window
        set name to \"🔧 Pathly Backend\"
        write text \"cd '$(pwd)/server' && echo '🚀 Starting Pathly AI Backend Server...' && ./start_flask.sh\"
    end tell
end tell"

# Wait a moment for backend to start
print_status "Waiting for backend to initialize..."
sleep 3

# Start frontend in new iTerm2 window
print_status "Starting Frontend in new iTerm2 window..."
osascript -e "tell application \"iTerm2\"
    create window with default profile
    tell current session of current window
        set name to \"📱 Pathly Frontend\"
        write text \"cd '$(pwd)' && echo '📱 Starting React Native Frontend...' && npm start\"
    end tell
end tell"

print_success "✅ Both services launched in separate iTerm2 windows!"
echo ""
echo "🌐 Backend API: http://localhost:5002"
echo "📱 Frontend: Check the 'Pathly Frontend' window for QR code"
echo ""
echo "💡 Tips:"
echo "   - Each service runs in its own iTerm2 window with a descriptive title"
echo "   - Scan the QR code with Expo Go app on your phone"
echo "   - Press 'w' in the frontend window to open in web browser"
echo "   - Close the windows to stop the services"

