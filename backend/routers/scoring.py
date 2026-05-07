"""Scoring router — NLP-powered multi-trait essay scoring."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database.seed_data import (
    SUBMISSIONS, SCORES, STUDENTS, ASSIGNMENTS, ESSAY_TEXTS, TRAIT_DEFINITIONS,
    add_score, update_submission
)
from services.scorer import score_essay
from services.feedback_generator import generate_full_feedback

router = APIRouter(prefix="/scoring", tags=["Scoring"])


@router.post("/score/{submission_id}")
def score_submission(submission_id: str):
    """Run NLP scoring pipeline on a submission."""
    from database.persistence import submissions_store, essays_store
    
    submissions = submissions_store.get_all()
    essays = {e["id"]: e["content"] for e in essays_store.get_all()}
    
    sub = next((s for s in submissions if s["id"] == submission_id), None)
    if not sub:
        raise HTTPException(404, detail="Submission not found")

    content = essays.get(submission_id)
    if not content:
        raise HTTPException(400, detail="No essay content found for this submission")

    # Run scorer
    result = score_essay(content)
    feedback = generate_full_feedback(result)

    # Update submission status
    update_submission(submission_id, {"status": "scored"})

    # Persist scores to storage
    for trait_score in result["traits"]:
        score_data = {
            "id": f"score-{submission_id}-{trait_score['trait_name'].lower().replace(' ', '_')}",
            "submission_id": submission_id,
            "trait_id": next((t["id"] for t in TRAIT_DEFINITIONS if t["name"] == trait_score["trait_name"]), "unknown"),
            "trait_name": trait_score["trait_name"],
            "raw_score": trait_score["raw_score"],
            "max_score": trait_score["max_raw"],
            "weight": trait_score["weight"],
            "scored_by": "automated",
            "scored_at": datetime.now().isoformat(),
        }
        add_score(score_data)

    return {
        "submission_id": submission_id,
        "overall_score": result["overall_score"],
        "overall_grade": result["overall_grade"],
        "traits": result["traits"],
        "feedback": feedback,
        "scored_at": datetime.now().isoformat(),
    }


@router.get("/scores/{submission_id}")
def get_scores(submission_id: str):
    """Retrieve existing scores for a submission."""
    sub_scores = [s for s in SCORES if s["submission_id"] == submission_id]
    if not sub_scores:
        raise HTTPException(404, detail="No scores found. Run POST /scoring/score/{id} first.")

    total_weighted = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
    total_weight = sum(s.get("weight", 1.0) for s in sub_scores)
    overall = round(total_weighted / max(total_weight, 1) / 25 * 100, 1)

    return {
        "submission_id": submission_id,
        "overall_score": overall,
        "traits": sub_scores,
        "scored_at": sub_scores[0]["scored_at"] if sub_scores else None,
    }


@router.post("/score-text")
def score_text_directly(payload: dict):
    """Score arbitrary text without a submission record."""
    text = payload.get("text", "")
    if len(text) < 50:
        raise HTTPException(400, detail="Text must be at least 50 characters")

    result = score_essay(text)
    feedback = generate_full_feedback(result)
    return {**result, "feedback": feedback}


@router.get("/all-scores")
def get_all_scores():
    """Return all scores with student and assignment info."""
    result = []
    for sub in SUBMISSIONS:
        sub_scores = [s for s in SCORES if s["submission_id"] == sub["id"]]
        if sub_scores:
            total_weighted = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
            total_weight = sum(s.get("weight", 1.0) for s in sub_scores)
            overall = round(total_weighted / max(total_weight, 1) / 25 * 100, 1)

            student = next((s for s in STUDENTS if s["id"] == sub["student_id"]), {})
            assignment = next((a for a in ASSIGNMENTS if a["id"] == sub["assignment_id"]), {})

            result.append({
                "submission_id": sub["id"],
                "student_name": student.get("name", "Unknown"),
                "assignment_title": assignment.get("title", "Unknown"),
                "overall_score": overall,
                "status": sub.get("status"),
                "submitted_at": sub.get("submitted_at"),
            })
    return result
