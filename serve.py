"""Local dev server: python serve.py, then open http://localhost:5173

Two things the plain `python -m http.server` gets wrong for us:
- on some Windows machines it serves .js as text/plain, and the browser then refuses to load modules
- it lets the browser cache files, so you keep seeing old code after an edit
"""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".glb": "model/gltf-binary",
        ".wasm": "application/wasm",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class Server(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with Server(("", PORT), Handler) as httpd:
        print(f"Relica running at http://localhost:{PORT}")
        httpd.serve_forever()
