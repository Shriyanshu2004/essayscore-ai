"""Analytics router — Dashboard data."""
from fastapi import APIRouter
from database.seed_data import (
    SUBMISSIONS, SCORES, STUDENTS, ASSIGNMENTS, TRAIT_DEFINITIONS,
    get_class_score_distribution, get_trait_averages
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
def get_dashboard():
    """Overall stats for the analytics dashboard."""
    total_students = len(STUDENTS)
    total_submissions = len(SUBMISSIONS)
    scored = [s for s in SUBMISSIONS if s["status"] == "scored"]

    # Average score across all scored submissions
    all_scored_scores = []
    for sub in scored:
        sub_scores = [s for s in SCORES if s["submission_id"] == sub["id"]]
        if sub_scores:
            tw = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
            w = sum(s.get("weight", 1.0) for s in sub_scores)
            all_scored_scores.append(tw / max(w, 1) / 25 * 100)

    avg_score = round(sum(all_scored_scores) / max(len(all_scored_scores), 1), 1)

    return {
        "total_students": total_students,
        "total_submissions": total_submissions,
        "scored_submissions": len(scored),
        "pending_submissions": total_submissions - len(scored),
        "average_score": avg_score,
        "score_distribution": get_class_score_distribution(),
        "trait_averages": get_trait_averages(),
        "submission_by_assignment": _submission_by_assignment(),
        "recent_activity": _recent_activity(),
    }


@router.get("/score-trends")
def get_score_trends():
    """Score trends over time (by submission date)."""
    trend_data = []
    for sub in sorted(SUBMISSIONS, key=lambda x: x["submitted_at"]):
        sub_scores = [s for s in SCORES if s["submission_id"] == sub["id"]]
        if sub_scores:
            tw = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
            w = sum(s.get("weight", 1.0) for s in sub_scores)
            overall = round(tw / max(w, 1) / 25 * 100, 1)
            student = next((st for st in STUDENTS if st["id"] == sub["student_id"]), {})
            trend_data.append({
                "date": sub["submitted_at"][:10],
                "score": overall,
                "student": student.get("name", "Unknown"),
            })
    return trend_data


@router.get("/trait-breakdown")
def get_trait_breakdown():
    """Per-trait score distribution across all students."""
    breakdown = {}
    for trait in TRAIT_DEFINITIONS:
        trait_scores = [s["raw_score"] / s["max_score"] * 100
                        for s in SCORES if s["trait_id"] == trait["id"]]
        if trait_scores:
            breakdown[trait["name"]] = {
                "average": round(sum(trait_scores) / len(trait_scores), 1),
                "min": round(min(trait_scores), 1),
                "max": round(max(trait_scores), 1),
                "count": len(trait_scores),
            }
    return breakdown


@router.get("/student-ranking")
def get_student_ranking():
    """Rank students by average score."""
    ranking = []
    for student in STUDENTS:
        subs = [s for s in SUBMISSIONS if s["student_id"] == student["id"]]
        student_scores = []
        for sub in subs:
            sub_scores = [s for s in SCORES if s["submission_id"] == sub["id"]]
            if sub_scores:
                tw = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
                w = sum(s.get("weight", 1.0) for s in sub_scores)
                student_scores.append(tw / max(w, 1) / 25 * 100)

        if student_scores:
            avg = round(sum(student_scores) / len(student_scores), 1)
            ranking.append({
                "student_id": student["id"],
                "name": student["name"],
                "average_score": avg,
                "submission_count": len(subs),
                "grade_level": student["grade_level"],
            })

    ranking.sort(key=lambda x: x["average_score"], reverse=True)
    for i, entry in enumerate(ranking):
        entry["rank"] = i + 1
    return ranking


def _submission_by_assignment():
    result = {}
    for a in ASSIGNMENTS:
        count = sum(1 for s in SUBMISSIONS if s["assignment_id"] == a["id"])
        result[a["title"][:40]] = count
    return result


def _recent_activity():
    recent = sorted(SUBMISSIONS, key=lambda x: x["submitted_at"], reverse=True)[:5]
    activity = []
    for sub in recent:
        student = next((s for s in STUDENTS if s["id"] == sub["student_id"]), {})
        activity.append({
            "student_name": student.get("name"),
            "action": "submitted essay",
            "assignment_id": sub["assignment_id"],
            "time": sub["submitted_at"],
            "status": sub["status"],
        })
    return activity
