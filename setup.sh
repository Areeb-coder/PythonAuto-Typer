#!/bin/bash
# Smart Auto Typer - Quick Setup Script

echo "🚀 Smart Auto Typer - Setup"
echo "================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install from https://www.python.org/"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing..."
    npm install -g pnpm
fi

echo "✓ Node.js $(node --version)"
echo "✓ Python $(python3 --version)"
echo "✓ pnpm $(pnpm --version)"
echo ""

# Install dependencies
echo "Installing dependencies..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Setup database
echo "Setting up database..."
pnpm db:push

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup database"
    exit 1
fi

echo "✓ Database setup complete"
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
cd apps/typing-engine
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo "✓ Python dependencies installed"
cd ../..
echo ""

echo "================================"
echo "✓ Setup complete!"
echo ""
echo "To start all services, run:"
echo "  python apps/desktop-runtime/launcher.py"
echo ""
echo "Or manually:"
echo "  Terminal 1: pnpm --filter backend dev"
echo "  Terminal 2: python apps/typing-engine/engine.py"
echo "  Terminal 3: pnpm --filter web dev"
echo ""
echo "Then open: http://localhost:3000"
