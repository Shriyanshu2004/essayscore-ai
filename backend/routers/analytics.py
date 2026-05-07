"""Analytics router — Dashboard data."""
from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _get_data():
    from database.persistence import (
        students_store, submissions_store, scores_store,
        assignments_store, trait_definitions_store
    )
    return {
        "students": students_store.get_all(),
        "submissions": submissions_store.get_all(),
        "scores": scores_store.get_all(),
        "assignments": assignments_store.get_all(),
        "traits": trait_definitions_store.get_all(),
    }


@router.get("/dashboard")
def get_dashboard():
    d = _get_data()
    students = d["students"]
    submissions = d["submissions"]
    scores = d["scores"]

    scored = [s for s in submissions if s["status"] == "scored"]

    all_scored_scores = []
    for sub in scored:
        sub_scores = [s for s in scores if s["submission_id"] == sub["id"]]
        if sub_scores:
            tw = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
            w  = sum(s.get("weight", 1.0) for s in sub_scores)
            all_scored_scores.append(tw / max(w, 1) / 25 * 100)

    avg_score = round(sum(all_scored_scores) / max(len(all_scored_scores), 1), 1)

    # Score distribution
    dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    for sc in all_scored_scores:
        if sc >= 90: dist["A"] += 1
        elif sc >= 80: dist["B"] += 1
        elif sc >= 70: dist["C"] += 1
        elif sc >= 60: dist["D"] += 1
        else: dist["F"] += 1

    # Trait averages
    trait_avgs = {}
    for score in scores:
        t = score["trait_name"]
        if t not in trait_avgs:
            trait_avgs[t] = []
        trait_avgs[t].append(score["raw_score"] / 25 * 100)
    trait_averages = {t: round(sum(v)/len(v), 1) for t, v in trait_avgs.items()} if trait_avgs else {
        "Grammar": 82, "Coherence": 85, "Vocabulary": 78, "Argument Strength": 80, "Style": 75
    }

    # Submissions by assignment
    assignments = d["assignments"]
    sub_by_asgn = {}
    for a in assignments:
        count = sum(1 for s in submissions if s["assignment_id"] == a["id"])
        sub_by_asgn[a["title"][:40]] = count

    # Recent activity
    recent = sorted(submissions, key=lambda x: x["submitted_at"], reverse=True)[:5]
    activity = []
    for sub in recent:
        student = next((s for s in students if s["id"] == sub["student_id"]), {})
        activity.append({
            "student_name": student.get("name", "Unknown"),
            "action": "submitted essay",
            "assignment_id": sub["assignment_id"],
            "time": sub["submitted_at"],
            "status": sub["status"],
        })

    return {
        "total_students": len(students),
        "total_submissions": len(submissions),
        "scored_submissions": len(scored),
        "pending_submissions": len(submissions) - len(scored),
        "average_score": avg_score,
        "score_distribution": dist,
        "trait_averages": trait_averages,
        "submission_by_assignment": sub_by_asgn,
        "recent_activity": activity,
    }


@router.get("/score-trends")
def get_score_trends():
    d = _get_data()
    submissions = d["submissions"]
    scores = d["scores"]
    students = d["students"]

    trend_data = []
    for sub in sorted(submissions, key=lambda x: x["submitted_at"]):
        sub_scores = [s for s in scores if s["submission_id"] == sub["id"]]
        if sub_scores:
            tw = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
            w  = sum(s.get("weight", 1.0) for s in sub_scores)
            overall = round(tw / max(w, 1) / 25 * 100, 1)
            student = next((st for st in students if st["id"] == sub["student_id"]), {})
            trend_data.append({
                "date": sub["submitted_at"][:10],
                "score": overall,
                "student": student.get("name", "Unknown"),
            })
    return trend_data


@router.get("/student-ranking")
def get_student_ranking():
    d = _get_data()
    students = d["students"]
    submissions = d["submissions"]
    scores = d["scores"]

    ranking = []
    for student in students:
        subs = [s for s in submissions if s["student_id"] == student["id"]]
        student_scores = []
        for sub in subs:
            sub_scores = [s for s in scores if s["submission_id"] == sub["id"]]
            if sub_scores:
                tw = sum(s["raw_score"] * s.get("weight", 1.0) for s in sub_scores)
                w  = sum(s.get("weight", 1.0) for s in sub_scores)
                student_scores.append(tw / max(w, 1) / 25 * 100)

        if student_scores:
            avg = round(sum(student_scores) / len(student_scores), 1)
            ranking.append({
                "student_id": student["id"],
                "name": student["name"],
                "average_score": avg,
                "submission_count": len(subs),
                "grade_level": student.get("grade_level", ""),
            })

    ranking.sort(key=lambda x: x["average_score"], reverse=True)
    for i, entry in enumerate(ranking):
        entry["rank"] = i + 1
    return ranking


@router.get("/trait-breakdown")
def get_trait_breakdown():
    d = _get_data()
    scores = d["scores"]

    breakdown = {}
    for score in scores:
        t = score["trait_name"]
        if t not in breakdown:
            breakdown[t] = []
        breakdown[t].append(score["raw_score"] / 25 * 100)

    return {
        t: {
            "average": round(sum(v)/len(v), 1),
            "min": round(min(v), 1),
            "max": round(max(v), 1),
            "count": len(v),
        }
        for t, v in breakdown.items()
    }
