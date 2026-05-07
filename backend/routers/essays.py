"""Essays router — CRUD for essay submissions."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from database.seed_data import (
    SUBMISSIONS, STUDENTS, ASSIGNMENTS, ESSAY_TEXTS,
    add_submission, add_essay
)

router = APIRouter(prefix="/essays", tags=["Essays"])


class EssaySubmitRequest(BaseModel):
    student_id: str
    assignment_id: str
    content: str
    version: Optional[int] = 1


@router.get("/")
def list_essays():
    """List all submissions with essay content - OPTIMIZED."""
    from database.persistence import submissions_store, students_store, assignments_store
    
    # Load all data once
    submissions = submissions_store.get_all()
    students = {s["id"]: s for s in students_store.get_all()}  # Dict for O(1) lookup
    assignments = {a["id"]: a for a in assignments_store.get_all()}  # Dict for O(1) lookup
    
    # Build result efficiently
    result = []
    for sub in submissions:
        student = students.get(sub["student_id"], {})
        assignment = assignments.get(sub["assignment_id"], {})
        result.append({
            **sub,
            "student_name": student.get("name", "Unknown"),
            "assignment_title": assignment.get("title", "Unknown"),
            "has_content": True,  # Assume all have content for speed
        })
    return result


@router.get("/{submission_id}")
def get_essay(submission_id: str):
    """Get full essay details including content - OPTIMIZED."""
    from database.persistence import submissions_store, students_store, assignments_store, essays_store
    
    # Load all data once
    submissions = {s["id"]: s for s in submissions_store.get_all()}
    students = {s["id"]: s for s in students_store.get_all()}
    assignments = {a["id"]: a for a in assignments_store.get_all()}
    essays = {e["id"]: e["content"] for e in essays_store.get_all()}
    
    sub = submissions.get(submission_id)
    if not sub:
        raise HTTPException(404, detail="Submission not found")

    student = students.get(sub["student_id"], {})
    assignment = assignments.get(sub["assignment_id"], {})
    content = essays.get(submission_id, "Essay content not available for this submission.")

    # Fast paragraph split
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    
    # Fast sentence count (approximate)
    sentence_count = content.count('.') + content.count('!') + content.count('?')

    return {
        **sub,
        "content": content,
        "paragraphs": paragraphs,
        "sentence_count": sentence_count,
        "student_name": student.get("name"),
        "assignment_title": assignment.get("title"),
        "assignment_description": assignment.get("description"),
    }


@router.post("/submit")
def submit_essay(req: EssaySubmitRequest):
    """Submit a new essay for scoring."""
    from database.persistence import students_store, assignments_store
    
    students = students_store.get_all()
    assignments = assignments_store.get_all()
    
    # Validate student and assignment exist
    student = next((s for s in students if s["id"] == req.student_id), None)
    assignment = next((a for a in assignments if a["id"] == req.assignment_id), None)

    if not student:
        raise HTTPException(404, detail="Student not found")
    if not assignment:
        raise HTTPException(404, detail="Assignment not found")

    sub_id = f"sub-new-{str(uuid.uuid4())[:8]}"
    word_count = len(req.content.split())

    new_submission = {
        "id": sub_id,
        "student_id": req.student_id,
        "assignment_id": req.assignment_id,
        "submitted_at": datetime.now().isoformat(),
        "word_count": word_count,
        "status": "submitted",
        "version": req.version,
    }

    add_submission(new_submission)
    add_essay(sub_id, req.content)

    return {
        "message": "Essay submitted successfully",
        "submission_id": sub_id,
        "word_count": word_count,
        "status": "submitted",
        "next_step": "Score this essay at POST /scoring/score/{submission_id}",
    }


@router.get("/{submission_id}/content")
def get_essay_content(submission_id: str):
    from database.persistence import essays_store
    essays = {e["id"]: e["content"] for e in essays_store.get_all()}
    
    content = essays.get(submission_id)
    if not content:
        raise HTTPException(404, detail="Essay content not found")
    return {"submission_id": submission_id, "content": content}
