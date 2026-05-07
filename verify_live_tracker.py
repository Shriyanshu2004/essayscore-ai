import requests
import time

BASE_URL = "http://localhost:8000/api"

def get_stats():
    resp = requests.get(f"{BASE_URL}/analytics/dashboard")
    return resp.json()

def submit_and_score():
    # 1. Submit
    submit_resp = requests.post(f"{BASE_URL}/essays/submit", json={
        "student_id": "s-001",
        "assignment_id": "a-001",
        "content": "Social media is bad for mental health. Research shows that it causes depression and anxiety in teenagers. We should limit screen time and promote physical activities. In conclusion, social media needs regulation to protect children.",
        "version": 1
    })
    sub_id = submit_resp.json()["submission_id"]
    print(f"Submitted: {sub_id}")
    
    # 2. Score
    score_resp = requests.post(f"{BASE_URL}/scoring/score/{sub_id}")
    print(f"Scored: {score_resp.status_code}")
    return score_resp.json()

print("Initial Stats:")
s1 = get_stats()
print(f"Total Submissions: {s1['total_submissions']}, Scored: {s1['scored_submissions']}")

print("\nSubmitting new essay...")
submit_and_score()

print("\nUpdated Stats:")
s2 = get_stats()
print(f"Total Submissions: {s2['total_submissions']}, Scored: {s2['scored_submissions']}")

if s2['total_submissions'] > s1['total_submissions'] and s2['scored_submissions'] > s1['scored_submissions']:
    print("\nSUCCESS: Live Tracker is working! Analytics updated dynamically.")
else:
    print("\nFAILURE: Stats did not update.")
