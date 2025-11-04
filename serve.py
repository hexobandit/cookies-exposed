#!/usr/bin/env python3
"""
Simple HTTP server for testing the cookie security website
Run with: python3 serve.py
Then visit: http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add security headers
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        super().end_headers()

if __name__ == "__main__":
    # Change to the script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🍪 Cookie Security Website Server")
        print(f"📡 Serving at http://localhost:{PORT}")
        print(f"📂 Directory: {os.getcwd()}")
        print(f"🌐 Opening browser...")
        print(f"🛑 Press Ctrl+C to stop")
        
        # Open browser
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped")