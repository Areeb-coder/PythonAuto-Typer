"""
Smart Auto Typer - Desktop Runtime Launcher
Starts all services: Backend, Typing Engine, and Frontend (in development)
"""

import subprocess
import sys
import time
import os
from pathlib import Path


class DesktopRuntime:
    def __init__(self):
        self.processes = []
        self.root_dir = Path(__file__).parent.parent
    
    def start_backend(self):
        """Start Fastify backend"""
        print("[Desktop Runtime] Starting Backend...")
        backend_dir = self.root_dir / 'apps' / 'backend'
        
        try:
            process = subprocess.Popen(
                ['pnpm', 'dev'],
                cwd=backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
            )
            self.processes.append(('Backend', process))
            print("[Desktop Runtime] Backend started (PID: {})".format(process.pid))
            return True
        except Exception as e:
            print(f"[Desktop Runtime] Failed to start Backend: {e}")
            return False
    
    def start_typing_engine(self):
        """Start Python typing engine"""
        print("[Desktop Runtime] Starting Typing Engine...")
        engine_dir = self.root_dir / 'apps' / 'typing-engine'
        
        try:
            process = subprocess.Popen(
                [sys.executable, 'engine.py'],
                cwd=engine_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
            )
            self.processes.append(('Typing Engine', process))
            print("[Desktop Runtime] Typing Engine started (PID: {})".format(process.pid))
            return True
        except Exception as e:
            print(f"[Desktop Runtime] Failed to start Typing Engine: {e}")
            return False
    
    def start_frontend(self):
        """Start Next.js frontend"""
        print("[Desktop Runtime] Starting Frontend...")
        frontend_dir = self.root_dir / 'apps' / 'web'
        
        try:
            process = subprocess.Popen(
                ['pnpm', 'dev'],
                cwd=frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
            )
            self.processes.append(('Frontend', process))
            print("[Desktop Runtime] Frontend started (PID: {})".format(process.pid))
            return True
        except Exception as e:
            print(f"[Desktop Runtime] Failed to start Frontend: {e}")
            return False
    
    def start_all(self):
        """Start all services"""
        print("[Desktop Runtime] Starting Smart Auto Typer...")
        print("[Desktop Runtime] Version: 1.0.0")
        print()
        
        # Start services in order
        services = [
            self.start_backend,
            self.start_typing_engine,
            self.start_frontend,
        ]
        
        for service in services:
            if not service():
                print("[Desktop Runtime] Failed to start all services")
                return False
            time.sleep(2)  # Wait for service to start
        
        print()
        print("[Desktop Runtime] All services started successfully!")
        print("[Desktop Runtime] Frontend: http://localhost:3000")
        print("[Desktop Runtime] Backend: http://localhost:4000")
        print("[Desktop Runtime] Typing Engine: localhost:5000")
        print()
        print("[Desktop Runtime] Press Ctrl+C to stop all services")
        
        return True
    
    def stop_all(self):
        """Stop all services"""
        print("\n[Desktop Runtime] Stopping all services...")
        for name, process in reversed(self.processes):
            try:
                print(f"[Desktop Runtime] Stopping {name}...")
                process.terminate()
                process.wait(timeout=5)
                print(f"[Desktop Runtime] {name} stopped")
            except Exception as e:
                print(f"[Desktop Runtime] Error stopping {name}: {e}")
                try:
                    process.kill()
                except:
                    pass
        
        print("[Desktop Runtime] All services stopped")
    
    def wait(self):
        """Wait for all processes"""
        try:
            for name, process in self.processes:
                process.wait()
        except KeyboardInterrupt:
            self.stop_all()


def main():
    runtime = DesktopRuntime()
    
    try:
        if runtime.start_all():
            runtime.wait()
    except KeyboardInterrupt:
        runtime.stop_all()
    except Exception as e:
        print(f"[Desktop Runtime] Fatal error: {e}")
        runtime.stop_all()
        sys.exit(1)


if __name__ == '__main__':
    main()
