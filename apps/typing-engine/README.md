# Smart Auto Typer - Typing Engine

Python daemon service that handles keyboard automation and typing queue management.

## Installation

```bash
pip install -r requirements.txt
```

## Running

```bash
python engine.py
```

## Requirements

- Python 3.8+
- PyAutoGUI

## Architecture

- Persistent daemon listening on port 5000
- Queue-based task processing
- Socket communication with backend
- Safe typing with configurable speed

## Features

- Reliable character-by-character typing
- Support for special characters and keys
- Queue management
- Status monitoring
