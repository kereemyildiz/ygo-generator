"""
SRS Link Manager - FastAPI Backend
Main application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from routes import upload, groups, files, ygo
from services.group_manager import group_manager


# Create FastAPI application
app = FastAPI(
    title="SRS Link Manager API",
    description="API for managing linked requirements documents in defense industry context",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Register files router before upload to prioritize more specific routes
app.include_router(files.router)
app.include_router(upload.router)
app.include_router(groups.router)
app.include_router(ygo.router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "SRS Link Manager API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "endpoints": {
            "upload": "/api/upload",
            "files": "/api/files",
            "analyze": "/api/analyze",
            "groups": "/api/groups",
            "ygo": "/api/ygo"
        }
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "SRS Link Manager API"
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle unexpected exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


# Application startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    # Clear all in-memory data on startup to ensure clean state
    group_manager.clear_all()

    print("="*80)
    print("  SRS Link Manager API - Starting")
    print("="*80)
    print(f"  Docs: http://localhost:8000/api/docs")
    print(f"  Health: http://localhost:8000/health")
    print("  In-memory storage cleared - starting with clean state")
    print("="*80)


# Application shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    print("\nSRS Link Manager API - Shutting down")


# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )
