# 🏗️ System Architecture

## Overview

The Automated Essay Scoring System uses a modern, scalable architecture with separated frontend, backend, and database layers.

---

## 🎨 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    (Students & Teachers)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (Frontend)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Application                      │  │
│  │  • Essay Submission Interface                            │  │
│  │  • Feedback Viewer with Annotations                      │  │
│  │  • Analytics Dashboard                                   │  │
│  │  • Rubric Builder                                        │  │
│  │  • Progress Tracking                                     │  │
│  │  • Peer Review Interface                                 │  │
│  │  • Plagiarism Report Viewer                              │  │
│  │  • Style Analyzer                                        │  │
│  │  • Batch Scoring Panel                                   │  │
│  │  • Teacher Calibration Tool                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API (JSON)
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RAILWAY (Backend)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  FastAPI Application                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              API Routers                           │  │  │
│  │  │  • /api/essays      • /api/scoring                 │  │  │
│  │  │  • /api/students    • /api/assignments             │  │  │
│  │  │  • /api/rubrics     • /api/plagiarism              │  │  │
│  │  │  • /api/peer-review • /api/analytics               │  │  │
│  │  │  • /api/batch                                      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              NLP Services                          │  │  │
│  │  │  • Grammar Checker (NLTK, spaCy)                   │  │  │
│  │  │  • Coherence Analyzer                              │  │  │
│  │  │  • Vocabulary Scorer                               │  │  │
│  │  │  • Argument Strength Evaluator                     │  │  │
│  │  │  • Style Analyzer (TextStat)                       │  │  │
│  │  │  • Plagiarism Detector (Sentence Transformers)     │  │  │
│  │  │  • Feedback Generator                              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────┬───────────┬────────────────────┘  │
└─────────────────────────────┼───────────┼───────────────────────┘
                              │           │
                    ┌─────────┘           └─────────┐
                    │                                 │
                    ▼                                 ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │  RAILWAY (PostgreSQL)     │   │  RAILWAY (MongoDB)        │
    │  ┌─────────────────────┐  │   │  ┌─────────────────────┐  │
    │  │  Relational Data    │  │   │  │  Document Data      │  │
    │  │  (3NF Normalized)   │  │   │  │  (Flexible Schema)  │  │
    │  │                     │  │   │  │                     │  │
    │  │  • students         │  │   │  │  • essays           │  │
    │  │  • assignments      │  │   │  │  • feedback         │  │
    │  │  • scores           │  │   │  │  • rubric_configs   │  │
    │  │  • rubrics          │  │   │  │  • plagiarism_rpts  │  │
    │  │  • rubric_criteria  │  │   │  │  • annotations      │  │
    │  │  • grade_boundaries │  │   │  │                     │  │
    │  │  • skills           │  │   │  │                     │  │
    │  │  • peer_reviews     │  │   │  │                     │  │
    │  └─────────────────────┘  │   │  └─────────────────────┘  │
    └───────────────────────────┘   └───────────────────────────┘
```

---

## 🔄 Data Flow

### Essay Submission Flow

```
1. Student submits essay
   ↓
2. Frontend (React) → POST /api/essays
   ↓
3. Backend (FastAPI) receives request
   ↓
4. Store essay content → MongoDB (essays collection)
   ↓
5. Store metadata → PostgreSQL (assignments, students)
   ↓
6. Trigger NLP pipeline
   ↓
7. Grammar check (NLTK/spaCy)
   ↓
8. Coherence analysis
   ↓
9. Vocabulary scoring
   ↓
10. Argument strength evaluation
   ↓
11. Style analysis (TextStat)
   ↓
12. Generate feedback
   ↓
13. Store scores → PostgreSQL (scores table)
   ↓
14. Store feedback → MongoDB (feedback collection)
   ↓
15. Return results → Frontend
   ↓
16. Display annotated feedback to student
```

### Plagiarism Detection Flow

```
1. Essay submitted
   ↓
2. Extract text → Sentence Transformers
   ↓
3. Generate embeddings
   ↓
4. Compare with existing essays (MongoDB)
   ↓
5. Calculate similarity scores
   ↓
6. Identify matches > threshold (0.75)
   ↓
7. Generate plagiarism report → MongoDB
   ↓
8. Display report to teacher
```

---

## 🗄️ Database Design

### PostgreSQL (Relational - 3NF)

**Purpose:** Structured data with relationships

```
students (1) ──────< (N) scores
    │                      │
    │                      │
    ▼                      ▼
assignments (1) ──────< (N) essays (metadata only)
    │
    │
    ▼
rubrics (1) ──────< (N) rubric_criteria
```

**Tables:**
- `students` - User profiles, authentication
- `assignments` - Assignment details, deadlines
- `scores` - Normalized scoring records
- `rubrics` - Scoring rubric definitions
- `rubric_criteria` - Individual scoring criteria
- `grade_boundaries` - Score-to-grade mappings
- `skills` - Learning objectives
- `peer_reviews` - Peer review assignments

### MongoDB (Document Store)

**Purpose:** Flexible, unstructured data

```
essays {
  _id: ObjectId,
  student_id: int,
  assignment_id: int,
  content: "Full essay text...",
  word_count: int,
  submitted_at: datetime
}

feedback {
  _id: ObjectId,
  essay_id: ObjectId,
  annotations: [
    {
      type: "grammar",
      text: "their",
      suggestion: "there",
      position: 45,
      severity: "error"
    }
  ],
  summary: "Overall feedback...",
  strengths: [...],
  improvements: [...]
}

rubric_configs {
  _id: ObjectId,
  assignment_id: int,
  criteria: {
    grammar: { weight: 0.3, description: "..." },
    coherence: { weight: 0.25, description: "..." },
    vocabulary: { weight: 0.2, description: "..." },
    argument: { weight: 0.25, description: "..." }
  }
}
```

---

## 🔌 API Architecture

### RESTful Endpoints

```
/api
├── /essays
│   ├── GET    /              # List all essays
│   ├── POST   /              # Submit new essay
│   ├── GET    /{id}          # Get essay by ID
│   └── GET    /student/{id}  # Get student's essays
│
├── /scoring
│   ├── POST   /score         # Score an essay
│   ├── GET    /{essay_id}    # Get scoring results
│   └── POST   /batch         # Batch score essays
│
├── /students
│   ├── GET    /              # List students
│   ├── POST   /              # Create student
│   └── GET    /{id}          # Get student details
│
├── /assignments
│   ├── GET    /              # List assignments
│   ├── POST   /              # Create assignment
│   ├── GET    /{id}          # Get assignment
│   └── PUT    /{id}          # Update assignment
│
├── /rubrics
│   ├── GET    /              # List rubrics
│   ├── POST   /              # Create rubric
│   ├── GET    /{id}          # Get rubric
│   └── PUT    /{id}          # Update rubric
│
├── /plagiarism
│   ├── POST   /check         # Check plagiarism
│   └── GET    /{essay_id}    # Get plagiarism report
│
├── /peer-review
│   ├── POST   /assign        # Assign peer review
│   ├── GET    /{student_id}  # Get assigned reviews
│   └── POST   /submit        # Submit peer review
│
├── /analytics
│   ├── GET    /overview      # System overview
│   ├── GET    /student/{id}  # Student analytics
│   └── GET    /assignment/{id} # Assignment analytics
│
└── /batch
    ├── POST   /upload        # Upload batch
    └── GET    /status/{id}   # Check batch status
```

---

## 🧠 NLP Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Essay Text Input                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Text Preprocessing                        │
│  • Tokenization                                             │
│  • Sentence segmentation                                    │
│  • POS tagging                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Grammar    │  │  Coherence  │  │ Vocabulary  │
│  Analysis   │  │  Analysis   │  │  Analysis   │
│             │  │             │  │             │
│  • NLTK     │  │  • spaCy    │  │  • Word     │
│  • spaCy    │  │  • Discourse│  │    diversity│
│  • Language │  │    markers  │  │  • Academic │
│    Tool     │  │  • Cohesion │  │    words    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│  Argument       │          │  Style          │
│  Analysis       │          │  Analysis       │
│                 │          │                 │
│  • Claim        │          │  • Readability  │
│    detection    │          │  • Passive voice│
│  • Evidence     │          │  • Sentence     │
│    evaluation   │          │    length       │
│  • Logic flow   │          │  • TextStat     │
└────────┬────────┘          └────────┬────────┘
         │                            │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Score Aggregation    │
         │   • Weighted average   │
         │   • Rubric application │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Feedback Generation   │
         │  • Template-based      │
         │  • LLM-enhanced (opt)  │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │    Final Results       │
         │  • Scores              │
         │  • Annotations         │
         │  • Suggestions         │
         └────────────────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: Transport Security
├── HTTPS/TLS encryption (Vercel & Railway)
├── Secure WebSocket connections
└── Certificate management (automatic)

Layer 2: Application Security
├── CORS protection (origin whitelist)
├── Input validation (Pydantic models)
├── SQL injection prevention (parameterized queries)
├── XSS protection (React escaping)
└── Rate limiting (ready for implementation)

Layer 3: Authentication & Authorization
├── User authentication (ready for implementation)
├── Role-based access control (student/teacher/admin)
├── Session management
└── JWT tokens (ready for implementation)

Layer 4: Data Security
├── Environment variable management
├── Database connection encryption
├── Sensitive data masking
└── Backup and recovery (Railway automatic)

Layer 5: Monitoring & Logging
├── Error tracking
├── Access logs
├── Performance monitoring
└── Security audit logs
```

---

## 📊 Scalability Considerations

### Current Architecture (Free Tier)
- **Users:** ~50 concurrent
- **Essays:** ~1000/month
- **Storage:** 1GB database
- **Bandwidth:** 100GB/month

### Scaling Strategy

**Phase 1: Optimize (0-500 users)**
- Database indexing
- Query optimization
- Caching (Redis)
- CDN for static assets

**Phase 2: Horizontal Scaling (500-5000 users)**
- Multiple backend instances
- Load balancer
- Database read replicas
- Separate NLP service

**Phase 3: Microservices (5000+ users)**
- Separate scoring service
- Separate plagiarism service
- Message queue (RabbitMQ/Kafka)
- Distributed caching
- Dedicated database clusters

---

## 🔄 Deployment Pipeline

```
Developer
    ↓
  Git Push
    ↓
  GitHub
    ↓
    ├─→ Vercel (Frontend)
    │   ├── Build React app
    │   ├── Run tests
    │   ├── Deploy to CDN
    │   └── Update DNS
    │
    └─→ Railway (Backend)
        ├── Build Python app
        ├── Install dependencies
        ├── Run migrations
        ├── Deploy container
        └── Health check
```

---

## 🎯 Technology Choices Rationale

### Why PostgreSQL?
- ✅ ACID compliance for scores
- ✅ Complex relationships (students, assignments, scores)
- ✅ Strong consistency requirements
- ✅ SQL queries for analytics

### Why MongoDB?
- ✅ Flexible schema for essays
- ✅ Variable rubric configurations
- ✅ Nested feedback annotations
- ✅ Fast document retrieval

### Why FastAPI?
- ✅ High performance (async)
- ✅ Automatic API documentation
- ✅ Type safety (Pydantic)
- ✅ Easy to deploy

### Why React?
- ✅ Component reusability
- ✅ Rich ecosystem
- ✅ Virtual DOM performance
- ✅ Large community

### Why Vercel?
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier

### Why Railway?
- ✅ Easy Python deployment
- ✅ Built-in databases
- ✅ Simple environment management
- ✅ Free tier

---

## 📈 Performance Metrics

### Target Performance
- **Page Load:** < 2 seconds
- **API Response:** < 500ms
- **Essay Scoring:** < 5 seconds
- **Plagiarism Check:** < 10 seconds
- **Batch Processing:** 100 essays/minute

### Monitoring Points
- Frontend load time
- API endpoint latency
- Database query time
- NLP processing time
- Error rates
- User engagement

---

## 🔮 Future Enhancements

1. **Real-time Collaboration**
   - WebSocket integration
   - Live essay editing
   - Real-time feedback

2. **Advanced NLP**
   - GPT-4 integration
   - Custom fine-tuned models
   - Multi-language support

3. **Mobile Apps**
   - React Native apps
   - Offline support
   - Push notifications

4. **Advanced Analytics**
   - Machine learning insights
   - Predictive analytics
   - Personalized recommendations

5. **Integration**
   - LMS integration (Canvas, Moodle)
   - Google Classroom
   - Microsoft Teams

---

This architecture provides a solid foundation for a production-ready essay scoring system with room for growth and enhancement.
