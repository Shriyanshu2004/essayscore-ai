# 🚀 Setup and Run Guide - EssayScore AI

## Quick Start (5 Minutes)

### Step 1: Start the Backend
```bash
cd backend
python main.py
```
✅ Backend should start on `http://localhost:8000`  
✅ Visit `http://localhost:8000/api/docs` to see API documentation

### Step 2: Start the Frontend
Open a new terminal:
```bash
cd frontend
npm run dev
```
✅ Frontend should start on `http://localhost:5173`  
✅ Open browser to `http://localhost:5173`

### Step 3: Test the System

#### Option A: Use Existing Students
Login with any existing student email:
- `alice@school.edu`
- `bob@school.edu`
- `chloe@school.edu`
- `david@school.edu`
- `emma@school.edu`

Password: anything (demo mode)

#### Option B: Create New Student
1. Click "Enroll Now" on login page
2. Fill in your details
3. Click "Enroll Now"
4. Login with your email

## Complete Workflow Test

### 1. Submit an Essay
1. Login as a student
2. Click "✍️ Essay Submission"
3. Select "Social Media Impact Essay"
4. Write or paste essay content
5. Click "Submit Essay"
6. Wait for automatic scoring

### 2. Browse Essays
1. Click "📚 Browse Essays" in sidebar
2. See all submitted essays
3. Filter by "Available to Review"
4. Click on any essay card

### 3. Review an Essay
1. Click "👥 Review This Essay"
2. Read the essay content
3. Rate on 3 criteria (1-5)
4. Write overall comments
5. Add strength and improvement
6. Click "🚀 Submit Review"

### 4. Check Notifications
1. Login as the essay author
2. Click "🔔 Notifications" (should show badge)
3. See the peer review feedback
4. Click "View Full Review"

### 5. View All Feedback
1. Click "💬 Feedback Viewer"
2. Select your submission
3. See AI feedback + peer reviews together

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Browse  │  │  Review  │  │  Notify  │             │
│  │  Essays  │  │  Essay   │  │  -cations│             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        │    HTTP/REST API Calls    │
        │             │             │
┌───────┼─────────────┼─────────────┼────────────────────┐
│       ▼             ▼             ▼                     │
│              BACKEND (FastAPI)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Essays  │  │   Peer   │  │  Notif   │             │
│  │  Router  │  │  Review  │  │  Router  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        │    File-Based Storage     │
        │             │             │
┌───────┼─────────────┼─────────────┼────────────────────┐
│       ▼             ▼             ▼                     │
│              DATA LAYER (JSON)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ essays   │  │  peer_   │  │  notif   │             │
│  │  .json   │  │ reviews  │  │ -cations │             │
│  │          │  │  .json   │  │  .json   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Data Files Location

All data is stored in: `backend/database/data/`

- `students.json` - Student profiles
- `assignments.json` - Essay assignments
- `submissions.json` - Essay metadata
- `essays.json` - Essay content
- `scores.json` - AI scoring results
- `peer_reviews.json` - Peer review data
- `notifications.json` - User notifications
- `trait_definitions.json` - Scoring rubrics

## Environment Configuration

### Backend (`backend/.env`)
```env
APP_NAME=EssayScore AI
APP_VERSION=1.0.0
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=8000
```

### Frontend (`frontend/.env.production`)
```env
VITE_API_URL=http://localhost:8000/api
```

## Common Issues & Solutions

### Issue: "Loading submissions..." forever
**Solution**: 
1. Check backend is running: `http://localhost:8000/api/health`
2. Check CORS settings in `backend/config.py`
3. Check browser console for errors (F12)
4. Verify `VITE_API_URL` in frontend `.env.production`

### Issue: Essays not showing in Browse
**Solution**:
1. Ensure essays are submitted (check `submissions.json`)
2. Verify essay content exists (check `essays.json`)
3. Check API response: `http://localhost:8000/api/essays`
4. Refresh the page

### Issue: Enrollment fails
**Solution**:
1. Check if email already exists in `students.json`
2. Verify backend is running
3. Check backend logs for errors
4. Try a different email address

### Issue: Notifications not appearing
**Solution**:
1. Submit a peer review first
2. Check `notifications.json` has entries
3. Verify student_id matches
4. Refresh notifications page

### Issue: Can't submit review
**Solution**:
1. Fill all required fields (comments is required)
2. Don't review your own essay
3. Check backend logs for errors
4. Verify essay exists

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access login page
- [ ] Can enroll new student
- [ ] Can login with existing student
- [ ] Can submit new essay
- [ ] Essay appears in Browse Essays
- [ ] Can click "Review This Essay"
- [ ] Can submit peer review
- [ ] Notification appears for essay author
- [ ] Can view notification details
- [ ] Can see feedback in Feedback Viewer
- [ ] Unread count shows in sidebar
- [ ] Can mark notification as read

## Performance Tips

1. **Backend**: Uses file-based storage, very fast for < 1000 records
2. **Frontend**: React with Vite, hot reload enabled
3. **API**: RESTful design, minimal latency
4. **Data**: JSON files auto-save on every change

## Security Notes

⚠️ **This is a demo/development system**:
- No real authentication (any password works)
- No encryption on data files
- No rate limiting
- No input sanitization
- CORS allows all origins in dev mode

For production use, implement:
- Real authentication (JWT tokens)
- Database (PostgreSQL + MongoDB)
- Input validation
- Rate limiting
- HTTPS
- Proper CORS configuration

## Next Steps

1. ✅ System is running
2. ✅ Test basic workflow
3. ✅ Submit essays
4. ✅ Review peers' essays
5. ✅ Check notifications
6. 📊 View analytics
7. 🎨 Customize styling
8. 🚀 Deploy to production

## Support

Need help?
1. Check this guide
2. Read `PEER_REVIEW_GUIDE.md`
3. Check API docs: `http://localhost:8000/api/docs`
4. Review browser console (F12)
5. Check backend terminal logs

---

**System**: EssayScore AI  
**Version**: 1.0  
**Last Updated**: May 7, 2026
