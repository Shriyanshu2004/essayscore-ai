"""
Professional data persistence layer using JSON files.
All data is automatically saved to disk and loaded on startup.
"""
import json
import os
from pathlib import Path
from typing import Any, Dict, List
from datetime import datetime
import threading

# Data directory
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# Thread lock for safe concurrent access
_lock = threading.Lock()


class DataStore:
    """Thread-safe persistent data store."""
    
    def __init__(self, filename: str):
        self.filepath = DATA_DIR / f"{filename}.json"
        self.data = self._load()
    
    def _load(self) -> List[Dict]:
        """Load data from file."""
        if self.filepath.exists():
            try:
                with open(self.filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading {self.filepath}: {e}")
                return []
        return []
    
    def _save(self):
        """Save data to file."""
        try:
            with open(self.filepath, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False, default=str)
        except Exception as e:
            print(f"Error saving {self.filepath}: {e}")
    
    def get_all(self) -> List[Dict]:
        """Get all records."""
        with _lock:
            return self.data.copy()
    
    def add(self, record: Dict) -> Dict:
        """Add a new record."""
        with _lock:
            self.data.append(record)
            self._save()
            return record
    
    def update(self, record_id: str, updates: Dict, id_field: str = "id") -> bool:
        """Update a record by ID."""
        with _lock:
            for i, record in enumerate(self.data):
                if record.get(id_field) == record_id:
                    self.data[i].update(updates)
                    self._save()
                    return True
            return False
    
    def delete(self, record_id: str, id_field: str = "id") -> bool:
        """Delete a record by ID."""
        with _lock:
            original_len = len(self.data)
            self.data = [r for r in self.data if r.get(id_field) != record_id]
            if len(self.data) < original_len:
                self._save()
                return True
            return False
    
    def find_one(self, **criteria) -> Dict | None:
        """Find one record matching criteria."""
        with _lock:
            for record in self.data:
                if all(record.get(k) == v for k, v in criteria.items()):
                    return record.copy()
            return None
    
    def find_many(self, **criteria) -> List[Dict]:
        """Find all records matching criteria."""
        with _lock:
            results = []
            for record in self.data:
                if all(record.get(k) == v for k, v in criteria.items()):
                    results.append(record.copy())
            return results
    
    def clear(self):
        """Clear all data (use with caution!)."""
        with _lock:
            self.data = []
            self._save()


# Initialize all data stores
students_store = DataStore("students")
assignments_store = DataStore("assignments")
submissions_store = DataStore("submissions")
scores_store = DataStore("scores")
essays_store = DataStore("essays")
rubrics_store = DataStore("rubrics")
peer_reviews_store = DataStore("peer_reviews")
notifications_store = DataStore("notifications")
trait_definitions_store = DataStore("trait_definitions")


def initialize_default_data():
    """Initialize with default data if stores are empty."""
    
    # Students
    if not students_store.get_all():
        default_students = [
            {"id": "stu-001", "name": "Alice Johnson", "email": "alice@school.edu", "grade_level": "11", "enrolled_at": "2025-09-01T00:00:00", "status": "active"},
            {"id": "stu-002", "name": "Bob Martinez", "email": "bob@school.edu", "grade_level": "11", "enrolled_at": "2025-09-01T00:00:00", "status": "active"},
            {"id": "stu-003", "name": "Chloe Thompson", "email": "chloe@school.edu", "grade_level": "10", "enrolled_at": "2025-09-01T00:00:00", "status": "active"},
            {"id": "stu-004", "name": "David Chen", "email": "david@school.edu", "grade_level": "12", "enrolled_at": "2025-09-01T00:00:00", "status": "active"},
            {"id": "stu-005", "name": "Emma Wilson", "email": "emma@school.edu", "grade_level": "10", "enrolled_at": "2025-09-01T00:00:00", "status": "active"},
        ]
        for student in default_students:
            students_store.add(student)
    
    # Assignments
    if not assignments_store.get_all():
        default_assignments = [
            {"id": "asgn-001", "title": "Social Media Impact Essay", "description": "Analyze the impact of social media on teenage mental health", "due_date": "2025-12-15", "word_limit": 800, "rubric_id": "rubric-001", "created_at": "2025-11-01T00:00:00"},
            {"id": "asgn-002", "title": "Climate Change Argument", "description": "Write a persuasive essay on climate change solutions", "due_date": "2025-12-20", "word_limit": 1000, "rubric_id": "rubric-001", "created_at": "2025-11-05T00:00:00"},
            {"id": "asgn-003", "title": "Technology in Education", "description": "Discuss the role of technology in modern education", "due_date": "2025-12-25", "word_limit": 750, "rubric_id": "rubric-001", "created_at": "2025-11-10T00:00:00"},
        ]
        for assignment in default_assignments:
            assignments_store.add(assignment)
    
    # Trait Definitions
    if not trait_definitions_store.get_all():
        default_traits = [
            {"id": "trait-001", "name": "Grammar", "description": "Grammar, spelling, and mechanics", "weight": 0.20, "max_score": 25},
            {"id": "trait-002", "name": "Coherence", "description": "Organization and logical flow", "weight": 0.24, "max_score": 25},
            {"id": "trait-003", "name": "Vocabulary", "description": "Word choice and variety", "weight": 0.16, "max_score": 25},
            {"id": "trait-004", "name": "Argument Strength", "description": "Thesis and supporting evidence", "weight": 0.30, "max_score": 25},
            {"id": "trait-005", "name": "Style", "description": "Writing style and voice", "weight": 0.14, "max_score": 25},
        ]
        for trait in default_traits:
            trait_definitions_store.add(trait)
    
    # Sample Submissions
    if not submissions_store.get_all():
        default_submissions = [
            {"id": "sub-001", "student_id": "stu-001", "assignment_id": "asgn-001", "submitted_at": "2025-12-01T10:30:00", "word_count": 650, "status": "submitted", "version": 1},
            {"id": "sub-002", "student_id": "stu-002", "assignment_id": "asgn-001", "submitted_at": "2025-12-01T14:20:00", "word_count": 720, "status": "submitted", "version": 1},
            {"id": "sub-003", "student_id": "stu-003", "assignment_id": "asgn-001", "submitted_at": "2025-12-02T09:15:00", "word_count": 580, "status": "submitted", "version": 1},
        ]
        for submission in default_submissions:
            submissions_store.add(submission)
    
    # Sample Essays
    if not essays_store.get_all():
        sample_essay = """Social media has become an integral part of teenage life, but its effects on mental health are deeply concerning. Platforms like Instagram and TikTok create unrealistic standards of beauty and success that teenagers feel compelled to meet. This constant comparison leads to anxiety, depression, and lowered self-esteem among adolescents.

Research from the American Psychological Association confirms that heavy social media use correlates with increased rates of depression in teenagers aged 13-17. A study of 6,500 students found that those who spent more than three hours daily on social media were 35% more likely to report poor mental health outcomes. These statistics paint a troubling picture of our digital generation.

Some argue that social media provides valuable connection and community for isolated teenagers. While this point has merit—particularly for LGBTQ+ youth or students in rural areas—the benefits do not outweigh the systematic harm caused by algorithmic content designed to maximize engagement at the expense of wellbeing.

Therefore, schools and parents must implement digital literacy programs and screen time guidelines to protect teenage mental health. Social media companies should also be held accountable through regulation requiring transparent reporting of harm-related metrics."""
        
        default_essays = [
            {"id": "sub-001", "content": sample_essay},
            {"id": "sub-002", "content": sample_essay},
            {"id": "sub-003", "content": sample_essay},
        ]
        for essay in default_essays:
            essays_store.add(essay)
    
    print("[OK] Data persistence initialized with default data")


# Initialize on module import
initialize_default_data()
