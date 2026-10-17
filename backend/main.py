"""
DOCeasy Backend - FastAPI Application
Main entry point and application configuration.
"""

import os
import sys
from pathlib import Path
import uuid
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.routers import tools, jobs
from app.core.config import settings
from app.core.cleanup import start_cleanup_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - startup and shutdown."""
    # Create temp directory on startup
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    # Start background cleanup task
    cleanup_task = asyncio.create_task(start_cleanup_scheduler())
    yield
    # Shutdown: cancel cleanup task
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="DOCeasy API",
    description="PDF Toolkit API - Your PDF tasks, simplified.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tools.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "DOCeasy API",
        "version": "1.0.0",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )
