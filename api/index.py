"""Vercel Python serverless entry point (root /api).

Vercel auto-detects .py files in the root `/api` directory as serverless
functions and picks up the module-level ASGI `app`. The FastAPI app lives in
../backend/app; that package is bundled via `includeFiles` in vercel.json and
made importable by putting ../backend on sys.path.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app  # noqa: E402

__all__ = ["app"]
