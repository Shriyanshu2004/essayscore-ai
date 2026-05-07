"""Students router — profiles and progress tracking."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from database.seed_data import (
    STUDENTS, SUBMISSIONS, SCORES, ASSIGNMENTS, get_student_progress,
    add_student
)

router = APIRouter(prefix="/students", tags=["Students"])


class StudentEnrollRequest(BaseModel):
    name: str
    email: str
    grade_level: Optional[str] = "10"
    password: Optional[str] = None


@router.get("/")
def list_students():
    # Reload from persistent storage
    from database.persistence import students_store
    return students_store.get_all()


@router.post("/enroll")
def enroll_student(req: StudentEnrollRequest):
    """Enroll a new student in the system."""
    # Reload current students
    from database.persistence import students_store
    current_students = students_store.get_all()
    
    # Check if email already exists
    existing = next((s for s in current_students if s["email"] == req.email), None)
    if existing:
        raise HTTPException(400, detail="Email already registered")

    # Generate new student ID
    student_id = f"stu-{str(uuid.uuid4())[:8]}"

    new_student = {
        "id": student_id,
        "name": req.name,
        "email": req.email,
        "grade_level": req.grade_level,
        "enrolled_at": datetime.now().isoformat(),
        "status": "active",
    }

    add_student(new_student)

    return {
        "message": "Student enrolled successfully",
        "student_id": student_id,
        "student": new_student,
        "next_step": "Login with your email to start submitting essays"
    }


@router.get("/{student_id}")
def get_student(student_id: str):
    student = next((s for s in STUDENTS if s["id"] == student_id), None)
    if not student:
        raise HTTPException(404, detail="Student not found")

    subs = [s for s in SUBMISSIONS if s["student_id"] == student_id]
    return {**student, "submission_count": len(subs), "submissions": subs}


@router.get("/{student_id}/progress")
def get_student_progress_view(student_id: str):
    """Return a student's full progress timeline across all submissions."""
    student = next((s for s in STUDENTS if s["id"] == student_id), None)
    if not student:
        raise HTTPException(404, detail="Student not found")

    progress = get_student_progress(student_id)

    # Compute trait improvement over time
    trait_trend = {}
    for entry in progress:
        for trait, score in entry.get("trait_breakdown", {}).items():
            if trait not in trait_trend:
                trait_trend[trait] = []
            trait_trend[trait].append({"date": entry["submitted_at"], "score": score})

    return {
        "student": student,
        "progress_entries": progress,
        "trait_trends": trait_trend,
        "total_submissions": len(progress),
        "average_score": round(
            sum(p["percentage"] for p in progress) / max(len(progress), 1), 1
        ),
    }


@router.get("/{student_id}/submissions")
def get_student_submissions(student_id: str):
    subs = [s for s in SUBMISSIONS if s["student_id"] == student_id]
    enriched = []
    for sub in subs:
        asgn = next((a for a in ASSIGNMENTS if a["id"] == sub["assignment_id"]), {})
        sub_scores = [s for s in SCORES if s["submission_id"] == sub["id"]]
        overall = None
        if sub_scores:
            tw = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
            w = sum(s.get("weight", 1.0) for s in sub_scores)
            overall = round(tw / max(w, 1) / 25 * 100, 1)
        enriched.append({**sub, "assignment_title": asgn.get("title"), "overall_score": overall})
    return enriched
