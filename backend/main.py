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


# ─── Frontend Static Files & SPA Routing ─────────────────────────────────────
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API docs and openapi schema to pass through
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_dist / "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "service": "DOCeasy PDF Toolkit API",
            "status": "online",
            "docs": "/docs",
            "health": "/api/health",
            "tools": "/api/tools",
            "version": "1.0.0",
        }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )
