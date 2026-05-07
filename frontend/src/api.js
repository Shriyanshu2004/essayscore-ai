/* Shared API helper */
const BASE = import.meta.env.VITE_API_URL || '/api'

// Mock data for when backend is not available
const MOCK_STUDENTS = [
  { id: 'stu-001', name: 'Alice Johnson', email: 'alice@school.edu', role: 'student' },
  { id: 'stu-002', name: 'Bob Martinez', email: 'bob@school.edu', role: 'student' },
  { id: 'stu-003', name: 'Chloe Thompson', email: 'chloe@school.edu', role: 'student' },
  { id: 'stu-004', name: 'David Chen', email: 'david@school.edu', role: 'student' },
  { id: 'stu-005', name: 'Emma Wilson', email: 'emma@school.edu', role: 'student' },
  { id: 'teacher-001', name: 'Dr. Emily Hart', email: 'teacher@school.edu', role: 'teacher' }
]

const MOCK_ASSIGNMENTS = [
  { id: 'asgn-001', title: 'Social Media Impact Essay', description: 'Analyze the impact of social media', word_limit: 800 },
  { id: 'asgn-002', title: 'Climate Change Argument', description: 'Write about climate solutions', word_limit: 1000 },
  { id: 'asgn-003', title: 'Technology in Education', description: 'Discuss technology role', word_limit: 750 }
]

export async function apiFetch(path, options = {}) {
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
    console.warn('API unavailable, using mock data:', path)
    
    // Return mock data based on path
    if (path === '/students/') return MOCK_STUDENTS
    if (path === '/assignments/') return MOCK_ASSIGNMENTS
    if (path === '/essays') return []
    if (path.includes('/analytics/')) return getMockAnalytics(path)
    
    return null
  }
}

function getMockAnalytics(path) {
  if (path.includes('dashboard')) {
    return {
      total_students: 6,
      total_submissions: 3,
      average_score: 84,
      scored_submissions: 3,
      score_distribution: { 'A': 2, 'B': 1, 'C': 0, 'D': 0, 'F': 0 },
      trait_averages: { 'Grammar': 85, 'Coherence': 88, 'Vocabulary': 82, 'Argument': 84, 'Style': 80 }
    }
  }
  if (path.includes('trends')) return []
  if (path.includes('ranking')) return []
  return null
}

export const api = {
  get:  (path)         => apiFetch(path),
  post: (path, body)   => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put:  (path, body)   => apiFetch(path, { method: 'PUT',  body: JSON.stringify(body) }),
}
