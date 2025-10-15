#!/bin/bash

echo "🚀 Starting Pathly App - Frontend + Backend"
echo "=========================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're on Windows (Git Bash, WSL, or PowerShell)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WSL_DISTRO_NAME" ]]; then
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

# Start backend server
echo "🔧 Starting AI Backend Server..."
if [ "$IS_WINDOWS" = true ]; then
    # Windows: Use start command to open new terminal
    start "Pathly Backend" bash -c "cd server && ./start_flask.sh"
else
    # macOS: Use iTerm2 or Terminal.app
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Check if iTerm2 is available
        if command_exists osascript && osascript -e 'tell application "iTerm2" to get version' >/dev/null 2>&1; then
            # Use iTerm2
            osascript -e "tell application \"iTerm2\"
                create window with default profile
                tell current session of current window
                    set name to \"Pathly Backend\"
                    write text \"cd '$(pwd)/server' && ./start_flask.sh\"
                end tell
            end tell"
        else
            # Fallback to Terminal.app
            osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/server' && ./start_flask.sh\""
        fi
    # Linux: Use gnome-terminal or xterm
    elif command_exists gnome-terminal; then
        gnome-terminal --title="Pathly Backend" -- bash -c "cd server && ./start_flask.sh; exec bash"
    elif command_exists xterm; then
        xterm -title "Pathly Backend" -e "cd server && ./start_flask.sh" &
    else
        echo "⚠️  Could not open new terminal for backend. Please run manually:"
        echo "   cd server && ./start_flask.sh"
    fi
fi

# Wait a moment for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Start frontend
echo "📱 Starting React Native Frontend..."
if [ "$IS_WINDOWS" = true ]; then
    # Windows: Use start command
    start "Pathly Frontend" bash -c "npm start"
else
    # macOS: Use iTerm2 or Terminal.app
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Check if iTerm2 is available
        if command_exists osascript && osascript -e 'tell application "iTerm2" to get version' >/dev/null 2>&1; then
            # Use iTerm2
            osascript -e "tell application \"iTerm2\"
                create window with default profile
                tell current session of current window
                    set name to \"Pathly Frontend\"
                    write text \"cd '$(pwd)' && npm start\"
                end tell
            end tell"
        else
            # Fallback to Terminal.app
            osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)' && npm start\""
        fi
    # Linux: Use gnome-terminal or xterm
    elif command_exists gnome-terminal; then
        gnome-terminal --title="Pathly Frontend" -- bash -c "npm start; exec bash"
    elif command_exists xterm; then
        xterm -title "Pathly Frontend" -e "npm start" &
    else
        echo "⚠️  Could not open new terminal for frontend. Please run manually:"
        echo "   npm start"
    fi
fi

echo ""
echo "✅ Both services starting..."
echo "🌐 Backend: http://localhost:5002"
echo "📱 Frontend: Check the Expo terminal for QR code"
echo ""
echo "💡 Tips:"
echo "   - Backend provides AI-powered safety predictions"
echo "   - Frontend works even without backend (fallback mode)"
echo "   - Check backend terminal for AI training status"
echo ""
echo "🛑 To stop: Close both terminal windows or press Ctrl+C in each"
