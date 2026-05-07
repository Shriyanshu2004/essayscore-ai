"""Peer review router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from database.seed_data import (
    PEER_REVIEWS, SUBMISSIONS, STUDENTS, NOTIFICATIONS,
    add_peer_review, update_peer_review, add_notification, update_notification
)

router = APIRouter(prefix="/peer-review", tags=["Peer Review"])


class PeerReviewSubmitRequest(BaseModel):
    submission_id: str
    reviewer_student_id: str
    grammar_score: float
    structure_score: float
    content_score: float
    comments: str
    strength: Optional[str] = None
    improvement: Optional[str] = None


@router.get("/")
def list_peer_reviews():
    """List all peer reviews - OPTIMIZED."""
    from database.persistence import peer_reviews_store, submissions_store, students_store
    
    # Load as dicts for O(1) lookup
    peer_reviews = peer_reviews_store.get_all()
    submissions = {s["id"]: s for s in submissions_store.get_all()}
    students = {s["id"]: s for s in students_store.get_all()}
    
    enriched = []
    for pr in peer_reviews:
        sub = submissions.get(pr["submission_id"], {})
        author = students.get(sub.get("student_id"), {})
        reviewer = students.get(pr["reviewer_student_id"], {})
        enriched.append({
            **pr,
            "essay_author": author.get("name", "Unknown"),
            "reviewer_name": reviewer.get("name", "Unknown"),
        })
    return enriched


@router.post("/assign")
def assign_peer_review(submission_id: str, reviewer_id: str):
    """Assign a submission for peer review."""
    from database.persistence import peer_reviews_store
    peer_reviews = peer_reviews_store.get_all()
    
    # Check for duplicate
    existing = next(
        (pr for pr in peer_reviews
         if pr["submission_id"] == submission_id and pr["reviewer_student_id"] == reviewer_id),
        None,
    )
    if existing:
        raise HTTPException(409, detail="This reviewer is already assigned to this submission")

    new_pr = {
        "id": f"pr-{str(uuid.uuid4())[:8]}",
        "submission_id": submission_id,
        "reviewer_student_id": reviewer_id,
        "assigned_at": datetime.now().isoformat(),
        "completed_at": None,
        "status": "pending",
    }
    add_peer_review(new_pr)
    return {"message": "Peer review assigned", "peer_review": new_pr}


@router.post("/submit")
def submit_peer_review(req: PeerReviewSubmitRequest):
    """Submit a completed peer review."""
    from database.persistence import peer_reviews_store, submissions_store, students_store
    
    peer_reviews = peer_reviews_store.get_all()
    submissions = submissions_store.get_all()
    students = students_store.get_all()
    
    pr = next(
        (p for p in peer_reviews
         if p["submission_id"] == req.submission_id
         and p["reviewer_student_id"] == req.reviewer_student_id),
        None,
    )
    if not pr:
        raise HTTPException(404, detail="Peer review assignment not found")

    updates = {
        "status": "completed",
        "completed_at": datetime.now().isoformat(),
        "scores": {
            "grammar": req.grammar_score,
            "structure": req.structure_score,
            "content": req.content_score,
            "overall": round((req.grammar_score + req.structure_score + req.content_score) / 3, 1),
        },
        "comments": req.comments,
        "strength": req.strength,
        "improvement": req.improvement,
    }
    
    update_peer_review(pr["id"], updates)
    pr.update(updates)

    # Get submission and author info
    submission = next((s for s in submissions if s["id"] == req.submission_id), None)
    reviewer = next((s for s in students if s["id"] == req.reviewer_student_id), None)
    
    if submission and reviewer:
        # Create notification for the essay author
        notification = {
            "id": f"notif-{str(uuid.uuid4())[:8]}",
            "student_id": submission["student_id"],  # Essay author
            "type": "peer_review",
            "title": "New Peer Review Received",
            "message": f"{reviewer['name']} reviewed your essay",
            "reviewer_name": reviewer["name"],
            "reviewer_id": req.reviewer_student_id,
            "submission_id": req.submission_id,
            "overall_score": pr["scores"]["overall"],
            "comments": req.comments,
            "strength": req.strength,
            "improvement": req.improvement,
            "created_at": datetime.now().isoformat(),
            "read": False,
        }
        add_notification(notification)

    return {"message": "Peer review submitted successfully", "review": pr}


@router.get("/notifications/{student_id}")
def get_notifications(student_id: str):
    """Get all notifications for a student."""
    from database.persistence import notifications_store
    notifications = notifications_store.get_all()
    
    student_notifications = [n for n in notifications if n["student_id"] == student_id]
    return sorted(student_notifications, key=lambda x: x["created_at"], reverse=True)


@router.get("/notifications/{student_id}/unread")
def get_unread_notifications(student_id: str):
    """Get unread notifications count for a student."""
    from database.persistence import notifications_store
    notifications = notifications_store.get_all()
    
    unread = [n for n in notifications if n["student_id"] == student_id and not n["read"]]
    return {"count": len(unread), "notifications": unread}


@router.post("/notifications/{notification_id}/mark-read")
def mark_notification_read(notification_id: str):
    """Mark a notification as read."""
    from database.persistence import notifications_store
    notifications = notifications_store.get_all()
    
    notification = next((n for n in notifications if n["id"] == notification_id), None)
    if not notification:
        raise HTTPException(404, detail="Notification not found")
    
    update_notification(notification_id, {"read": True})
    return {"message": "Notification marked as read"}


@router.get("/received/{student_id}")
def get_received_reviews(student_id: str):
    """Get all peer reviews received by a student - OPTIMIZED."""
    from database.persistence import peer_reviews_store, submissions_store, students_store
    
    # Load as dicts for fast lookup
    peer_reviews = peer_reviews_store.get_all()
    submissions = {s["id"]: s for s in submissions_store.get_all()}
    students = {s["id"]: s for s in students_store.get_all()}
    
    # Find all submissions by this student (fast)
    student_submission_ids = {sid for sid, s in submissions.items() if s["student_id"] == student_id}
    
    # Find all completed reviews for those submissions
    received_reviews = []
    for pr in peer_reviews:
        if pr["submission_id"] in student_submission_ids and pr["status"] == "completed":
            reviewer = students.get(pr["reviewer_student_id"], {})
            submission = submissions.get(pr["submission_id"], {})
            received_reviews.append({
                **pr,
                "reviewer_name": reviewer.get("name", "Unknown"),
                "submission_info": submission,
            })
    
    return sorted(received_reviews, key=lambda x: x.get("completed_at", ""), reverse=True)


@router.get("/queue/{student_id}")
def get_review_queue(student_id: str):
    """Get pending peer reviews for a student."""
    from database.persistence import peer_reviews_store
    peer_reviews = peer_reviews_store.get_all()
    
    return [pr for pr in peer_reviews if pr["reviewer_student_id"] == student_id and pr["status"] != "completed"]


@router.get("/available-for-review/{student_id}")
def get_available_essays_for_review(student_id: str):
    """Get essays available for peer review - OPTIMIZED."""
    from database.persistence import submissions_store, students_store, assignments_store, peer_reviews_store
    
    # Load as dicts for O(1) lookup
    submissions = submissions_store.get_all()
    students = {s["id"]: s for s in students_store.get_all()}
    assignments = {a["id"]: a for a in assignments_store.get_all()}
    peer_reviews = peer_reviews_store.get_all()
    
    # Build set of already reviewed submission IDs for fast lookup
    reviewed_ids = {
        pr["submission_id"] 
        for pr in peer_reviews 
        if pr["reviewer_student_id"] == student_id and pr["status"] == "completed"
    }
    
    # Get essays not by current student and not already reviewed
    available_essays = []
    for sub in submissions:
        if sub["student_id"] != student_id and sub["id"] not in reviewed_ids:
            student = students.get(sub["student_id"], {})
            assignment = assignments.get(sub["assignment_id"], {})
            available_essays.append({
                **sub,
                "student_name": student.get("name", "Unknown"),
                "assignment_title": assignment.get("title", "Unknown"),
                "has_content": True,
            })
    
    return sorted(available_essays, key=lambda x: x.get("submitted_at", ""), reverse=True)
