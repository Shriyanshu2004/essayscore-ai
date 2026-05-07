"""Assignments router."""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.get("/")
def list_assignments():
    from database.persistence import assignments_store
    return assignments_store.get_all()


@router.get("/{assignment_id}")
def get_assignment(assignment_id: str):
    from database.persistence import assignments_store
    assignments = assignments_store.get_all()
    assignment = next((a for a in assignments if a["id"] == assignment_id), None)
    if not assignment:
        raise HTTPException(404, detail="Assignment not found")
    return assignment
