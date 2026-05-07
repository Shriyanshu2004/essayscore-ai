"""Rubrics router — Rubric builder and teacher calibration."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

from database.seed_data import RUBRIC_CONFIGS, ASSIGNMENTS

router = APIRouter(prefix="/rubrics", tags=["Rubrics"])


class TraitDescriptorIn(BaseModel):
    score: int
    label: str
    description: str


class RubricTraitIn(BaseModel):
    name: str
    max_score: int = 25
    weight: float = 1.0
    descriptors: List[TraitDescriptorIn] = []


class RubricCreateRequest(BaseModel):
    assignment_id: str
    name: str
    description: Optional[str] = None
    traits: List[RubricTraitIn]
    grade_scale: str = "percentage"


class ScoreOverrideRequest(BaseModel):
    submission_id: str
    trait_name: str
    override_score: float
    teacher_note: Optional[str] = None


@router.get("/")
def list_rubrics():
    return RUBRIC_CONFIGS


@router.get("/{rubric_id}")
def get_rubric(rubric_id: str):
    rubric = next((r for r in RUBRIC_CONFIGS if r["id"] == rubric_id or r["rubric_id"] == rubric_id), None)
    if not rubric:
        raise HTTPException(404, detail="Rubric not found")
    return rubric


@router.get("/assignment/{assignment_id}")
def get_rubric_for_assignment(assignment_id: str):
    rubric = next((r for r in RUBRIC_CONFIGS if r["assignment_id"] == assignment_id), None)
    if not rubric:
        raise HTTPException(404, detail="No rubric found for this assignment")
    return rubric


@router.post("/create")
def create_rubric(req: RubricCreateRequest):
    """Create a new rubric configuration (stored in MongoDB in production)."""
    new_rubric = {
        "id": f"rc-{str(uuid.uuid4())[:8]}",
        "rubric_id": f"r-{str(uuid.uuid4())[:8]}",
        "assignment_id": req.assignment_id,
        "name": req.name,
        "description": req.description,
        "traits": [t.dict() for t in req.traits],
        "grade_scale": req.grade_scale,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    RUBRIC_CONFIGS.append(new_rubric)
    return {"message": "Rubric created", "rubric": new_rubric}


@router.put("/{rubric_id}")
def update_rubric(rubric_id: str, req: RubricCreateRequest):
    """Update an existing rubric."""
    rubric = next((r for r in RUBRIC_CONFIGS if r["id"] == rubric_id), None)
    if not rubric:
        raise HTTPException(404, detail="Rubric not found")

    rubric["name"] = req.name
    rubric["description"] = req.description
    rubric["traits"] = [t.dict() for t in req.traits]
    rubric["grade_scale"] = req.grade_scale
    rubric["updated_at"] = datetime.now().isoformat()

    return {"message": "Rubric updated", "rubric": rubric}


@router.post("/calibrate/override")
def override_score(req: ScoreOverrideRequest):
    """Teacher overrides automated score for a specific trait."""
    return {
        "message": "Score override recorded",
        "submission_id": req.submission_id,
        "trait_name": req.trait_name,
        "override_score": req.override_score,
        "teacher_note": req.teacher_note,
        "overridden_at": datetime.now().isoformat(),
    }
