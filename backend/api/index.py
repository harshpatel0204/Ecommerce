"""Vercel Python serverless entry point.

Vercel's @vercel/python runtime looks for a module-level ASGI/WSGI `app`.
We simply re-export the FastAPI app; all routing lives in app.main.
"""
from app.main import app

__all__ = ["app"]
