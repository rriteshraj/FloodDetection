#!/usr/bin/env python3
import http.server
import socketserver
import os
from pathlib import Path

PORT = 3000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # If requesting root or no file specified, serve index.html
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        
        # Serve the requested file
        try:
            f = self.send_head()
            if f:
                self.copyfile(f, self.wfile)
                f.close()
        except Exception as e:
            print(f"Error: {e}")
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        return super().end_headers()

print(f"✓ Starting server on http://localhost:{PORT}")
print(f"✓ Serving from: {os.getcwd()}")
print("✓ Press Ctrl+C to stop\n")

Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")

