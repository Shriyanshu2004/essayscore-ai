"""
Automated Essay Scoring & Feedback System — FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import essays, scoring, students, assignments, rubrics, plagiarism, peer_review, analytics, batch

# ─────────────────────────────────────────────────────────────
# Application Factory
# ─────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## Automated Essay Scoring & Feedback System

    A comprehensive NLP-powered platform for:
    - **Multi-trait essay scoring** (Grammar, Coherence, Vocabulary, Argument Strength, Style)
    - **Automated feedback generation** with inline annotations
    - **Plagiarism detection** against internal and external sources
    - **Student progress tracking** across assignments
    - **Teacher calibration** and rubric management
    - **Peer review** assignment and moderation
    - **Writing style analysis** with readability metrics
    - **Batch scoring** for bulk essay processing

    ### Database
    - **PostgreSQL** (3NF): Students, assignments, scores, grade boundaries, skill mappings
    - **MongoDB**: Essay content, rubric configurations, feedback annotations
    """,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─────────────────────────────────────────────────────────────
# CORS Middleware
# ─────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Register Routers
# ─────────────────────────────────────────────────────────────

app.include_router(essays.router,       prefix="/api")
app.include_router(scoring.router,      prefix="/api")
app.include_router(students.router,     prefix="/api")
app.include_router(assignments.router,  prefix="/api")
app.include_router(rubrics.router,      prefix="/api")
app.include_router(plagiarism.router,   prefix="/api")
app.include_router(peer_review.router,  prefix="/api")
app.include_router(analytics.router,    prefix="/api")
app.include_router(batch.router,        prefix="/api")


# ─────────────────────────────────────────────────────────────
# Root Endpoint
# ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/api/docs",
        "endpoints": {
            "essays":       "/api/essays",
            "scoring":      "/api/scoring",
            "students":     "/api/students",
            "assignments":  "/api/assignments",
            "rubrics":      "/api/rubrics",
            "plagiarism":   "/api/plagiarism",
            "peer_review":  "/api/peer-review",
            "analytics":    "/api/analytics",
            "batch":        "/api/batch",
        }
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "mode": "simulated_data"}


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
