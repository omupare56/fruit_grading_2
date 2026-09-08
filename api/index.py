"""
Vercel Serverless Function Entry Point for Python Flask Backend.
Maps /api/* requests to Flask app instance.
"""
from backend.app import app

# Vercel WSGI Handler
handler = app
