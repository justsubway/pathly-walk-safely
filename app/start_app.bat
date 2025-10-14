@echo off
echo 🚀 Starting Pathly App - Frontend + Backend
echo ==========================================

REM Start backend server in new window
echo 🔧 Starting AI Backend Server...
start "Pathly Backend" cmd /k "cd server && start_flask.bat"

REM Wait for backend to start
echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo 📱 Starting React Native Frontend...
start "Pathly Frontend" cmd /k "npm start"

echo.
echo ✅ Both services starting...
echo 🌐 Backend: http://localhost:5002
echo 📱 Frontend: Check the Expo terminal for QR code
echo.
echo 💡 Tips:
echo    - Backend provides AI-powered safety predictions
echo    - Frontend works even without backend (fallback mode)
echo    - Check backend terminal for AI training status
echo.
echo 🛑 To stop: Close both terminal windows or press Ctrl+C in each
pause
