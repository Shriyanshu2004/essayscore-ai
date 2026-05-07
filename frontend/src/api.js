/* Shared API helper - Uses localStorage for persistence */
import { localAPI } from './storage'

const BASE = import.meta.env.VITE_API_URL || '/api'
const USE_LOCAL_STORAGE = true // Set to true for Vercel deployment without backend

export async function apiFetch(path, options = {}) {
  // Use localStorage if enabled
  if (USE_LOCAL_STORAGE) {
    return handleLocalStorage(path, options)
  }
  
  // Try real API
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) {
      throw new Error('API error')
    }
    return await res.json()
  } catch (e) {
    console.warn('API unavailable, using localStorage')
    return handleLocalStorage(path, options)
  }
}

function handleLocalStorage(path, options = {}) {
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body) : null
  
  // Students
  if (path === '/students/' && method === 'GET') {
    return Promise.resolve(localAPI.getStudents())
  }
  if (path === '/students/enroll' && method === 'POST') {
    const newStudent = {
      id: `stu-${Date.now()}`,
      ...body,
      enrolled_at: new Date().toISOString(),
      status: 'active',
      role: 'student'
    }
    localAPI.addStudent(newStudent)
    return Promise.resolve({ message: 'Student enrolled', student_id: newStudent.id, student: newStudent })
  }
  
  // Assignments
  if (path === '/assignments/' && method === 'GET') {
    return Promise.resolve(localAPI.getAssignments())
  }
  
  // Essays/Submissions
  if (path === '/essays' && method === 'GET') {
    const submissions = localAPI.getSubmissions()
    const students = localAPI.getStudents()
    const assignments = localAPI.getAssignments()
    
    return Promise.resolve(submissions.map(sub => ({
      ...sub,
      student_name: students.find(s => s.id === sub.student_id)?.name || 'Unknown',
      assignment_title: assignments.find(a => a.id === sub.assignment_id)?.title || 'Unknown',
      has_content: true
    })))
  }
  
  if (path.startsWith('/essays/') && method === 'GET') {
    const id = path.split('/')[2]
    const submission = localAPI.getSubmissions().find(s => s.id === id)
    const essay = localAPI.getEssay(id)
    const students = localAPI.getStudents()
    const assignments = localAPI.getAssignments()
    
    if (submission && essay) {
      return Promise.resolve({
        ...submission,
        content: essay.content,
        paragraphs: essay.content.split('\n\n'),
        sentence_count: (essay.content.match(/[.!?]/g) || []).length,
        student_name: students.find(s => s.id === submission.student_id)?.name,
        assignment_title: assignments.find(a => a.id === submission.assignment_id)?.title
      })
    }
  }
  
  if (path === '/essays/submit' && method === 'POST') {
    const submissionId = `sub-${Date.now()}`
    const submission = {
      id: submissionId,
      student_id: body.student_id,
      assignment_id: body.assignment_id,
      submitted_at: new Date().toISOString(),
      word_count: body.content.split(/\s+/).length,
      status: 'submitted',
      version: 1
    }
    localAPI.addSubmission(submission)
    localAPI.addEssay({ id: submissionId, content: body.content })
    
    return Promise.resolve({ 
      message: 'Essay submitted', 
      submission_id: submissionId,
      word_count: submission.word_count,
      status: 'submitted'
    })
  }
  
  // Scoring
  if (path.startsWith('/scoring/score/') && method === 'POST') {
    const submissionId = path.split('/')[3]
    const submission = localAPI.getSubmissions().find(s => s.id === submissionId)
    
    if (submission) {
      // Generate mock scores
      const traits = ['Grammar', 'Coherence', 'Vocabulary', 'Argument Strength', 'Style']
      traits.forEach(trait => {
        const score = {
          id: `score-${Date.now()}-${trait}`,
          submission_id: submissionId,
          trait_name: trait,
          raw_score: Math.floor(Math.random() * 20) + 80,
          percentage: Math.floor(Math.random() * 20) + 80,
          grade: 'A',
          weight: 1.0,
          scored_at: new Date().toISOString()
        }
        localAPI.addScore(score)
      })
      
      // Update submission status
      const submissions = localAPI.getSubmissions()
      const index = submissions.findIndex(s => s.id === submissionId)
      if (index !== -1) {
        submissions[index].status = 'scored'
        localAPI.set('SUBMISSIONS', submissions)
      }
      
      return Promise.resolve({ message: 'Scored successfully', overall_score: 85 })
    }
  }
  
  // Analytics
  if (path.includes('/analytics/dashboard')) {
    return Promise.resolve(localAPI.getAnalytics())
  }
  if (path.includes('/analytics/score-trends')) {
    return Promise.resolve([])
  }
  if (path.includes('/analytics/student-ranking')) {
    return Promise.resolve([])
  }
  
  // Peer Reviews
  if (path === '/peer-review/' && method === 'GET') {
    return Promise.resolve(localAPI.getPeerReviews())
  }
  if (path.startsWith('/peer-review/assign') && method === 'POST') {
    const params = new URLSearchParams(path.split('?')[1])
    const review = {
      id: `pr-${Date.now()}`,
      submission_id: params.get('submission_id'),
      reviewer_student_id: params.get('reviewer_id'),
      assigned_at: new Date().toISOString(),
      status: 'pending'
    }
    localAPI.addPeerReview(review)
    return Promise.resolve({ message: 'Assigned', peer_review: review })
  }
  if (path === '/peer-review/submit' && method === 'POST') {
    const review = localAPI.getPeerReviews().find(
      r => r.submission_id === body.submission_id && r.reviewer_student_id === body.reviewer_student_id
    )
    if (review) {
      const updates = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        scores: {
          grammar: body.grammar_score,
          structure: body.structure_score,
          content: body.content_score,
          overall: Math.round((body.grammar_score + body.structure_score + body.content_score) / 3)
        },
        comments: body.comments,
        strength: body.strength,
        improvement: body.improvement
      }
      localAPI.updatePeerReview(review.id, updates)
      
      // Create notification
      const submission = localAPI.getSubmissions().find(s => s.id === body.submission_id)
      const reviewer = localAPI.getStudents().find(s => s.id === body.reviewer_student_id)
      if (submission && reviewer) {
        const notification = {
          id: `notif-${Date.now()}`,
          student_id: submission.student_id,
          type: 'peer_review',
          title: 'New Peer Review Received',
          message: `${reviewer.name} reviewed your essay`,
          reviewer_name: reviewer.name,
          reviewer_id: body.reviewer_student_id,
          submission_id: body.submission_id,
          overall_score: updates.scores.overall,
          comments: body.comments,
          strength: body.strength,
          improvement: body.improvement,
          created_at: new Date().toISOString(),
          read: false
        }
        localAPI.addNotification(notification)
      }
      
      return Promise.resolve({ message: 'Review submitted', review: { ...review, ...updates } })
    }
  }
  
  // Notifications
  if (path.startsWith('/peer-review/notifications/') && !path.includes('mark-read')) {
    const studentId = path.split('/')[3]
    const notifications = localAPI.getNotifications().filter(n => n.student_id === studentId)
    
    if (path.includes('/unread')) {
      const unread = notifications.filter(n => !n.read)
      return Promise.resolve({ count: unread.length, notifications: unread })
    }
    
    return Promise.resolve(notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
  }
  
  if (path.includes('mark-read') && method === 'POST') {
    const notifId = path.split('/')[3]
    localAPI.updateNotification(notifId, { read: true })
    return Promise.resolve({ message: 'Marked as read' })
  }
  
  return Promise.resolve(null)
}

export const api = {
  get:  (path)         => apiFetch(path),
  post: (path, body)   => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put:  (path, body)   => apiFetch(path, { method: 'PUT',  body: JSON.stringify(body) }),
}
