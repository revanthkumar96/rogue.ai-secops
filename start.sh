#!/bin/bash

# Rouge.ai - The Fairy Tail
# Single command startup script

echo "✨ Starting Rouge.ai - The Fairy Tail ✨"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if Ollama is running
echo "${BLUE}🔍 Checking Ollama...${NC}"
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running. Please start it with:"
    echo "   ollama serve"
    echo ""
    echo "Continuing anyway..."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "${BLUE}📦 Installing dependencies...${NC}"
    bun install
fi

# Start backend server in background
echo "${GREEN}🚀 Starting API Server (port 3000)...${NC}"
cd packages/rouge
bun run dev serve --port 3000 &
BACKEND_PID=$!
cd ../..

# Wait for backend to be ready
echo "${BLUE}⏳ Waiting for API to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "${GREEN}✅ API Server is ready!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ API Server failed to start"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

# Start frontend dev server
echo "${PURPLE}🎨 Starting Web UI (port 3001)...${NC}"
cd packages/web
bun run dev --port 3001 &
FRONTEND_PID=$!
cd ../..

# Wait a bit for frontend to start
sleep 3

echo ""
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${PURPLE}✨ Rouge.ai - The Fairy Tail is READY! ✨${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "${BLUE}📡 API Server:${NC}  http://localhost:3000"
echo "${PURPLE}🌐 Web UI:${NC}      http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "${BLUE}🛑 Shutting down Rouge.ai...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait
