"""Students router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from database.seed_data import add_student, get_student_progress

router = APIRouter(prefix="/students", tags=["Students"])


class StudentEnrollRequest(BaseModel):
    name: str
    email: str
    grade_level: Optional[str] = "10"
    password: Optional[str] = None


@router.get("/")
def list_students():
    from database.persistence import students_store
    return students_store.get_all()


@router.post("/enroll")
def enroll_student(req: StudentEnrollRequest):
    from database.persistence import students_store
    current_students = students_store.get_all()

    existing = next((s for s in current_students if s["email"] == req.email), None)
    if existing:
        raise HTTPException(400, detail="Email already registered")

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
    }


@router.get("/{student_id}")
def get_student(student_id: str):
    from database.persistence import students_store, submissions_store
    students = students_store.get_all()
    student = next((s for s in students if s["id"] == student_id), None)
    if not student:
        raise HTTPException(404, detail="Student not found")
    subs = [s for s in submissions_store.get_all() if s["student_id"] == student_id]
    return {**student, "submission_count": len(subs), "submissions": subs}


@router.get("/{student_id}/progress")
def get_student_progress_view(student_id: str):
    from database.persistence import students_store
    students = students_store.get_all()
    student = next((s for s in students if s["id"] == student_id), None)
    if not student:
        raise HTTPException(404, detail="Student not found")

    progress = get_student_progress(student_id)
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
    from database.persistence import submissions_store, scores_store, assignments_store
    submissions = submissions_store.get_all()
    scores = scores_store.get_all()
    assignments = {a["id"]: a for a in assignments_store.get_all()}

    subs = [s for s in submissions if s["student_id"] == student_id]
    enriched = []
    for sub in subs:
        sub_scores = [s for s in scores if s["submission_id"] == sub["id"]]
        overall = None
        if sub_scores:
            tw = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
            w  = sum(s.get("weight", 1.0) for s in sub_scores)
            overall = round(tw / max(w, 1) / 25 * 100, 1)
        enriched.append({
            **sub,
            "assignment_title": assignments.get(sub["assignment_id"], {}).get("title"),
            "overall_score": overall
        })
    return enriched
