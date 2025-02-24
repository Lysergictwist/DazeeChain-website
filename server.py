from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1)
    webbrowser.open('http://localhost:8001')

# Set up the server
handler = SimpleHTTPRequestHandler
server = HTTPServer(('localhost', 8001), handler)

# Open the browser
threading.Thread(target=open_browser).start()

# Start the server
print("Starting server at http://localhost:8001")
server.serve_forever()
