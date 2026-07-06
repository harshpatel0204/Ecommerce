"""Convenience entry point to run the backend directly from the backend/ folder.

Usage:
    cd backend
    python main.py

This simply imports the FastAPI app and starts uvicorn.
All application logic remains in app/main.py.
"""

import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="razorpay")
warnings.filterwarnings("ignore", message=".*pkg_resources is deprecated.*")

import uvicorn

from app.main import app  # noqa: F401

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
