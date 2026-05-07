/* Local Storage Database - Persistent data in browser */

const STORAGE_KEYS = {
  STUDENTS: 'essayscore_students',
  ASSIGNMENTS: 'essayscore_assignments',
  SUBMISSIONS: 'essayscore_submissions',
  ESSAYS: 'essayscore_essays',
  SCORES: 'essayscore_scores',
  PEER_REVIEWS: 'essayscore_peer_reviews',
  NOTIFICATIONS: 'essayscore_notifications'
}

// Initialize with seed data if empty
const SEED_DATA = {
  students: [
    { id: 'stu-001', name: 'Alice Johnson', email: 'alice@school.edu', grade_level: '11', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'stu-002', name: 'Bob Martinez', email: 'bob@school.edu', grade_level: '11', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'stu-003', name: 'Chloe Thompson', email: 'chloe@school.edu', grade_level: '10', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'stu-004', name: 'David Chen', email: 'david@school.edu', grade_level: '12', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'stu-005', name: 'Emma Wilson', email: 'emma@school.edu', grade_level: '10', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'teacher-001', name: 'Dr. Emily Hart', email: 'teacher@school.edu', role: 'teacher', enrolled_at: '2025-09-01T00:00:00', status: 'active' }
  ],
  assignments: [
    { id: 'asgn-001', title: 'Social Media Impact Essay', description: 'Analyze the impact of social media on teenage mental health', due_date: '2025-12-15', word_limit: 800, created_at: '2025-11-01T00:00:00' },
    { id: 'asgn-002', title: 'Climate Change Argument', description: 'Write a persuasive essay on climate change solutions', due_date: '2025-12-20', word_limit: 1000, created_at: '2025-11-05T00:00:00' },
    { id: 'asgn-003', title: 'Technology in Education', description: 'Discuss the role of technology in modern education', due_date: '2025-12-25', word_limit: 750, created_at: '2025-11-10T00:00:00' }
  ],
  submissions: [],
  essays: [],
  scores: [],
  peer_reviews: [],
  notifications: []
}

class LocalStorage {
  constructor() {
    this.initializeData()
  }

  initializeData() {
    // Initialize with seed data if empty
    Object.keys(STORAGE_KEYS).forEach(key => {
      const storageKey = STORAGE_KEYS[key]
      if (!localStorage.getItem(storageKey)) {
        const dataKey = key.toLowerCase()
        localStorage.setItem(storageKey, JSON.stringify(SEED_DATA[dataKey] || []))
      }
    })
  }

  get(key) {
    const data = localStorage.getItem(STORAGE_KEYS[key])
    return data ? JSON.parse(data) : []
  }

  set(key, value) {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value))
  }

  add(key, item) {
    const data = this.get(key)
    data.push(item)
    this.set(key, data)
    return item
  }

  update(key, id, updates) {
    const data = this.get(key)
    const index = data.findIndex(item => item.id === id)
    if (index !== -1) {
      data[index] = { ...data[index], ...updates }
      this.set(key, data)
      return data[index]
    }
    return null
  }

  delete(key, id) {
    const data = this.get(key)
    const filtered = data.filter(item => item.id !== id)
    this.set(key, filtered)
  }

  clear() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    this.initializeData()
  }
}

export const storage = new LocalStorage()

// API wrapper using localStorage
export const localAPI = {
  // Students
  getStudents: () => storage.get('STUDENTS'),
  addStudent: (student) => storage.add('STUDENTS', student),
  
  // Assignments
  getAssignments: () => storage.get('ASSIGNMENTS'),
  
  // Submissions
  getSubmissions: () => storage.get('SUBMISSIONS'),
  addSubmission: (submission) => storage.add('SUBMISSIONS', submission),
  
  // Essays
  getEssays: () => storage.get('ESSAYS'),
  addEssay: (essay) => storage.add('ESSAYS', essay),
  getEssay: (id) => storage.get('ESSAYS').find(e => e.id === id),
  
  // Scores
  getScores: () => storage.get('SCORES'),
  addScore: (score) => storage.add('SCORES', score),
  
  // Peer Reviews
  getPeerReviews: () => storage.get('PEER_REVIEWS'),
  addPeerReview: (review) => storage.add('PEER_REVIEWS', review),
  updatePeerReview: (id, updates) => storage.update('PEER_REVIEWS', id, updates),
  
  // Notifications
  getNotifications: () => storage.get('NOTIFICATIONS'),
  addNotification: (notification) => storage.add('NOTIFICATIONS', notification),
  updateNotification: (id, updates) => storage.update('NOTIFICATIONS', id, updates),
  
  // Analytics
  getAnalytics: () => {
    const students = storage.get('STUDENTS')
    const submissions = storage.get('SUBMISSIONS')
    const scores = storage.get('SCORES')
    
    return {
      total_students: students.length,
      total_submissions: submissions.length,
      average_score: scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length) : 0,
      scored_submissions: submissions.filter(s => s.status === 'scored').length,
      score_distribution: { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 },
      trait_averages: { 'Grammar': 85, 'Coherence': 88, 'Vocabulary': 82, 'Argument': 84, 'Style': 80 }
    }
  }
}
