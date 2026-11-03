#!/usr/bin/env python3
"""
诗词夜游 — 本地静态服务器
用法:  python3 server.py [端口]   默认 5173
然后打开 http://127.0.0.1:5173
"""
import http.server
import json
import mimetypes
import os
import socket
import socketserver
import sys
import threading
import time
from functools import partial

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173

mimetypes.add_type("application/json", ".json")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("font/woff2", ".woff2")


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = mimetypes.types_map

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("  %s\n" % (fmt % args))

    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) and not self.path.endswith("/"):
            self.path += "/"
        return super().do_GET()


def local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    os.chdir(ROOT)
    with Server(("0.0.0.0", PORT), Handler) as httpd:
        print("")
        print("  🌕  诗词夜游  已启动")
        print("  ─────────────────────────────")
        print(f"  本机:    http://127.0.0.1:{PORT}")
        print(f"  局域网:  http://{local_ip()}:{PORT}   (手机可访问)")
        print("  ─────────────────────────────")
        print("  按 Ctrl+C 停止")
        print("")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  已停止，感谢同游。\n")


if __name__ == "__main__":
    main()
