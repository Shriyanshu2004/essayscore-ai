"""Batch scoring router — score multiple essays at once."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime

from database.seed_data import SUBMISSIONS, ESSAY_TEXTS, STUDENTS, ASSIGNMENTS
from services.scorer import score_essay
from services.feedback_generator import generate_full_feedback

router = APIRouter(prefix="/batch", tags=["Batch Scoring"])


class BatchScoreRequest(BaseModel):
    submission_ids: List[str]


@router.post("/score")
def batch_score(req: BatchScoreRequest):
    """Score multiple submissions in one request."""
    results = []
    errors = []

    for sub_id in req.submission_ids:
        try:
            sub = next((s for s in SUBMISSIONS if s["id"] == sub_id), None)
            if not sub:
                errors.append({"submission_id": sub_id, "error": "Submission not found"})
                continue

            content = ESSAY_TEXTS.get(sub_id)
            if not content:
                errors.append({"submission_id": sub_id, "error": "No essay content"})
                continue

            scoring = score_essay(content)
            feedback = generate_full_feedback(scoring)

            student = next((s for s in STUDENTS if s["id"] == sub["student_id"]), {})
            assignment = next((a for a in ASSIGNMENTS if a["id"] == sub["assignment_id"]), {})

            sub["status"] = "scored"

            results.append({
                "submission_id": sub_id,
                "student_name": student.get("name", "Unknown"),
                "assignment_title": assignment.get("title", "Unknown"),
                "overall_score": scoring["overall_score"],
                "overall_grade": scoring["overall_grade"],
                "traits": scoring["traits"],
                "word_count": sub.get("word_count"),
                "scored_at": datetime.now().isoformat(),
                "status": "success",
            })
        except Exception as e:
            errors.append({"submission_id": sub_id, "error": str(e)})

    return {
        "total_requested": len(req.submission_ids),
        "total_scored": len(results),
        "total_errors": len(errors),
        "results": results,
        "errors": errors,
        "batch_completed_at": datetime.now().isoformat(),
    }


@router.get("/pending")
def get_pending_submissions():
    """Get all submissions not yet scored."""
    pending = [s for s in SUBMISSIONS if s["status"] in ("submitted", "draft")]
    enriched = []
    for sub in pending:
        student = next((s for s in STUDENTS if s["id"] == sub["student_id"]), {})
        assignment = next((a for a in ASSIGNMENTS if a["id"] == sub["assignment_id"]), {})
        enriched.append({
            **sub,
            "student_name": student.get("name"),
            "assignment_title": assignment.get("title"),
            "has_content": sub["id"] in ESSAY_TEXTS,
        })
    return enriched


@router.get("/results")
def get_batch_results():
    """Get all scored submission results."""
    scored = [s for s in SUBMISSIONS if s["status"] == "scored"]
    results = []
    for sub in scored:
        student = next((s for s in STUDENTS if s["id"] == sub["student_id"]), {})
        assignment = next((a for a in ASSIGNMENTS if a["id"] == sub["assignment_id"]), {})
        results.append({
            **sub,
            "student_name": student.get("name"),
            "assignment_title": assignment.get("title"),
        })
    return results
