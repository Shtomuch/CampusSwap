#!/bin/bash

echo "🚀 Starting CampusSwap..."
echo ""

# Kill existing processes
pkill -f "dotnet.*CampusSwap.WebApi" || true
pkill -f "react-scripts start" || true

# Start backend
echo "📦 Starting Backend..."
cd src/CampusSwap.WebApi
dotnet build --no-restore > /dev/null 2>&1
dotnet run --no-build > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Start frontend
echo "🎨 Starting Frontend..."
cd ../../client
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""

echo "========================================="
echo "🎉 CampusSwap is running!"
echo "========================================="
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📚 Swagger: http://localhost:5000/swagger"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait