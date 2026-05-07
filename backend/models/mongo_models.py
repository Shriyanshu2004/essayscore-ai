"""
Pydantic models representing MongoDB document schemas.
These define the structure of the three core collections:
  - essays
  - rubric_configurations
  - feedback_annotations
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid


# ─────────────────────────────────────────────────────────────
# ESSAYS COLLECTION
# ─────────────────────────────────────────────────────────────

class EssayDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    submission_id: str
    student_id: str
    assignment_id: str
    content: str                            # Full raw essay text
    paragraphs: List[str] = []             # Auto-split paragraphs
    word_count: int = 0
    sentence_count: int = 0
    version: int = 1
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


# ─────────────────────────────────────────────────────────────
# RUBRIC CONFIGURATIONS COLLECTION
# ─────────────────────────────────────────────────────────────

class TraitDescriptor(BaseModel):
    score: int                              # e.g. 1, 2, 3, 4
    label: str                              # e.g. "Beginning"
    description: str                        # Rubric cell text


class RubricTrait(BaseModel):
    name: str                               # e.g. "Grammar"
    max_score: int = 25
    weight: float = 1.0
    descriptors: List[TraitDescriptor] = []


class RubricConfiguration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rubric_id: str                          # FK to PostgreSQL rubrics.id
    assignment_id: str
    name: str
    description: Optional[str] = None
    traits: List[RubricTrait] = []
    grade_scale: str = "percentage"         # "percentage" | "points" | "letter"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


# ─────────────────────────────────────────────────────────────
# FEEDBACK ANNOTATIONS COLLECTION
# ─────────────────────────────────────────────────────────────

class Annotation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    start_offset: int                       # Character offset in essay text
    end_offset: int
    annotation_type: str                    # "grammar" | "style" | "structure" | "argument"
    severity: str = "warning"              # "info" | "warning" | "error"
    message: str
    suggestion: Optional[str] = None
    rule_id: Optional[str] = None          # LanguageTool rule ID if applicable


class TraitFeedback(BaseModel):
    trait_name: str
    score: float
    max_score: float
    feedback: str
    strengths: List[str] = []
    improvements: List[str] = []


class FeedbackAnnotationDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    submission_id: str
    student_id: str
    annotations: List[Annotation] = []
    trait_feedback: List[TraitFeedback] = []
    holistic_feedback: str = ""
    overall_score: float = 0.0
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    source: str = "automated"              # "automated" | "teacher" | "peer"
    teacher_overrides: Dict[str, Any] = {}  # trait_name -> override_score

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


# ─────────────────────────────────────────────────────────────
# PLAGIARISM DETAIL COLLECTION
# ─────────────────────────────────────────────────────────────

class MatchedPassage(BaseModel):
    source_type: str                        # "internal" | "external"
    source_id: Optional[str] = None        # submission_id if internal
    source_url: Optional[str] = None       # URL if external
    source_title: Optional[str] = None
    matched_text: str
    original_text: str
    similarity_score: float                 # 0.0–1.0
    start_offset: int
    end_offset: int


class PlagiarismDetailDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    submission_id: str
    overall_similarity: float = 0.0        # 0–100 percentage
    matched_passages: List[MatchedPassage] = []
    checked_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
