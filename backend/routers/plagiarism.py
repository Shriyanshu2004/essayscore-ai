"""Plagiarism detection router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database.seed_data import SUBMISSIONS, ESSAY_TEXTS, STUDENTS
from services.plagiarism_service import detect_plagiarism

router = APIRouter(prefix="/plagiarism", tags=["Plagiarism"])

# In-memory cache of results
_results_cache: dict = {}


@router.post("/check/{submission_id}")
def check_plagiarism(submission_id: str):
    """Run plagiarism check on a submission."""
    sub = next((s for s in SUBMISSIONS if s["id"] == submission_id), None)
    if not sub:
        raise HTTPException(404, detail="Submission not found")

    content = ESSAY_TEXTS.get(submission_id)
    if not content:
        raise HTTPException(400, detail="No essay content found")

    # Build internal corpus (all OTHER submissions with content)
    internal_corpus = []
    for other_sub in SUBMISSIONS:
        if other_sub["id"] == submission_id:
            continue
        other_content = ESSAY_TEXTS.get(other_sub["id"])
        if other_content:
            student = next((s for s in STUDENTS if s["id"] == other_sub["student_id"]), {})
            internal_corpus.append({
                "submission_id": other_sub["id"],
                "student_name": student.get("name", "Unknown Student"),
                "content": other_content,
            })

    result = detect_plagiarism(content, internal_corpus)
    result["submission_id"] = submission_id
    result["checked_at"] = datetime.now().isoformat()

    # Cache result
    _results_cache[submission_id] = result

    return result


@router.get("/report/{submission_id}")
def get_plagiarism_report(submission_id: str):
    """Get cached plagiarism report or run check."""
    if submission_id in _results_cache:
        return _results_cache[submission_id]

    # Auto-run if not cached
    return check_plagiarism(submission_id)


@router.post("/check-text")
def check_text_plagiarism(payload: dict):
    """Check arbitrary text against internal corpus."""
    text = payload.get("text", "")
    if len(text) < 50:
        raise HTTPException(400, detail="Text must be at least 50 characters")

    internal_corpus = [
        {"submission_id": sid, "student_name": "Student", "content": content}
        for sid, content in ESSAY_TEXTS.items()
    ]
    result = detect_plagiarism(text, internal_corpus)
    return result
