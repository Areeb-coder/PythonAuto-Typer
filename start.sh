#!/bin/bash
# Smart Auto Typer - Quick Start Script

echo "🚀 Starting Smart Auto Typer..."
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    PYTHON_CMD="python3"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Start all services using the launcher
echo "Starting services..."
$PYTHON_CMD apps/desktop-runtime/launcher.py
