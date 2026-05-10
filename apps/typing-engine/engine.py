"""
Smart Auto Typer - Python Typing Engine
Persistent daemon that handles keyboard input automation
"""

import pyautogui
import time
import json
import socket
import threading
import logging
from queue import Queue
from dataclasses import dataclass, asdict
from typing import Optional
from datetime import datetime
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# PyAutoGUI settings
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.05  # Pause between key presses


@dataclass
class TypingTask:
    """Represents a typing task"""
    task_id: str
    text: str
    speed: int = 60  # Characters per second
    created_at: str = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()


class TypingEngine:
    """Main typing engine that handles queued typing tasks"""
    
    def __init__(self, host: str = 'localhost', port: int = 5000):
        self.host = host
        self.port = port
        self.queue: Queue = Queue()
        self.running = False
        self.is_typing = False
        self.total_characters = 0
        self.start_time = datetime.now()
        self.current_task: Optional[TypingTask] = None
        
        logger.info(f'Typing Engine initialized on {host}:{port}')
    
    def start(self):
        """Start the typing engine"""
        self.running = True
        logger.info('Typing Engine started')
        
        # Start background typing thread
        typing_thread = threading.Thread(target=self._typing_loop, daemon=True)
        typing_thread.start()
        
        # Start server socket
        try:
            self._start_server()
        except KeyboardInterrupt:
            self.stop()
    
    def stop(self):
        """Stop the typing engine"""
        self.running = False
        logger.info('Typing Engine stopped')
        sys.exit(0)
    
    def _typing_loop(self):
        """Main loop that processes typing tasks"""
        while self.running:
            try:
                # Get task from queue with timeout
                task = self.queue.get(timeout=1)
                self._execute_task(task)
            except:
                # Queue timeout - just continue
                time.sleep(0.1)
                continue
    
    def _execute_task(self, task: TypingTask):
        """Execute a typing task"""
        try:
            self.is_typing = True
            self.current_task = task
            
            logger.info(f'Starting to type task {task.task_id}: {len(task.text)} chars')
            
            start_time = time.time()
            
            # Calculate delay between characters
            char_delay = 1.0 / task.speed
            
            # Type each character
            for char in task.text:
                if not self.running:
                    break
                
                # Handle special characters
                if char == '\n':
                    pyautogui.press('enter')
                elif char == '\t':
                    pyautogui.press('tab')
                elif char == ' ':
                    pyautogui.press('space')
                else:
                    pyautogui.typewrite(char, interval=char_delay)
                
                self.total_characters += 1
                time.sleep(char_delay)
            
            duration = time.time() - start_time
            logger.info(f'Completed task {task.task_id} in {duration:.2f}s')
            
            self.is_typing = False
            self.current_task = None
            
        except Exception as e:
            logger.error(f'Error executing task {task.task_id}: {e}')
            self.is_typing = False
            self.current_task = None
    
    def queue_task(self, task: TypingTask):
        """Add a task to the queue"""
        self.queue.put(task)
        logger.debug(f'Task queued: {task.task_id}')
    
    def get_status(self) -> dict:
        """Get current engine status"""
        uptime = (datetime.now() - self.start_time).total_seconds()
        
        return {
            'running': self.running,
            'is_typing': self.is_typing,
            'queue_length': self.queue.qsize(),
            'total_characters': self.total_characters,
            'uptime': uptime,
            'current_task': asdict(self.current_task) if self.current_task else None,
        }
    
    def clear_queue(self):
        """Clear all pending tasks"""
        while not self.queue.empty():
            try:
                self.queue.get_nowait()
            except:
                break
        logger.info('Queue cleared')
    
    def stop_typing(self):
        """Stop current typing and clear queue"""
        self.is_typing = False
        self.current_task = None
        self.clear_queue()
        logger.info('Typing stopped')
    
    def _start_server(self):
        """Start TCP server to receive commands from backend"""
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((self.host, self.port))
        server_socket.listen(5)
        
        logger.info(f'Server listening on {self.host}:{self.port}')
        
        try:
            while self.running:
                try:
                    client_socket, address = server_socket.accept()
                    logger.info(f'Client connected from {address}')
                    
                    # Handle client in separate thread
                    client_thread = threading.Thread(
                        target=self._handle_client,
                        args=(client_socket, address),
                        daemon=True
                    )
                    client_thread.start()
                except Exception as e:
                    logger.error(f'Error accepting client: {e}')
        finally:
            server_socket.close()
    
    def _handle_client(self, client_socket: socket.socket, address):
        """Handle client connection"""
        try:
            data = client_socket.recv(4096)
            if data:
                message = json.loads(data.decode('utf-8'))
                response = self._process_command(message)
                client_socket.send(json.dumps(response).encode('utf-8'))
        except Exception as e:
            logger.error(f'Error handling client {address}: {e}')
        finally:
            client_socket.close()
    
    def _process_command(self, command: dict) -> dict:
        """Process command from backend"""
        cmd_type = command.get('type')
        
        try:
            if cmd_type == 'type':
                task = TypingTask(
                    task_id=command.get('task_id'),
                    text=command.get('text'),
                    speed=command.get('speed', 60)
                )
                self.queue_task(task)
                return {'success': True, 'message': 'Task queued'}
            
            elif cmd_type == 'status':
                return {'success': True, 'status': self.get_status()}
            
            elif cmd_type == 'stop':
                self.stop_typing()
                return {'success': True, 'message': 'Typing stopped'}
            
            elif cmd_type == 'clear':
                self.clear_queue()
                return {'success': True, 'message': 'Queue cleared'}
            
            else:
                return {'success': False, 'error': 'Unknown command'}
        
        except Exception as e:
            logger.error(f'Error processing command: {e}')
            return {'success': False, 'error': str(e)}


def main():
    """Main entry point"""
    try:
        engine = TypingEngine(host='0.0.0.0', port=5000)
        engine.start()
    except KeyboardInterrupt:
        logger.info('Shutting down...')
        sys.exit(0)
    except Exception as e:
        logger.error(f'Fatal error: {e}')
        sys.exit(1)


if __name__ == '__main__':
    main()
