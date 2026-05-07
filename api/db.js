// Vercel KV database helper
import { kv } from '@vercel/kv'

// Seed data - only used on first run
const SEED = {
  students: [
    { id: 'stu-001', name: 'Alice Johnson', email: 'alice@school.edu', grade_level: '11', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'stu-002', name: 'Bob Martinez', email: 'bob@school.edu', grade_level: '11', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'stu-003', name: 'Chloe Thompson', email: 'chloe@school.edu', grade_level: '10', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'stu-004', name: 'David Chen', email: 'david@school.edu', grade_level: '12', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' },
    { id: 'stu-005', name: 'Emma Wilson', email: 'emma@school.edu', grade_level: '10', role: 'student', enrolled_at: '2025-09-01T00:00:00', status: 'active' }
  ],
  assignments: [
    { id: 'asgn-001', title: 'Social Media Impact Essay', description: 'Analyze the impact of social media on teenage mental health', due_date: '2025-12-15', word_limit: 800, created_at: '2025-11-01T00:00:00' },
    { id: 'asgn-002', title: 'Climate Change Argument', description: 'Write a persuasive essay on climate change solutions', due_date: '2025-12-20', word_limit: 1000, created_at: '2025-11-05T00:00:00' },
    { id: 'asgn-003', title: 'Technology in Education', description: 'Discuss the role of technology in modern education', due_date: '2025-12-25', word_limit: 750, created_at: '2025-11-10T00:00:00' }
  ]
}

export async function getList(key) {
  const data = await kv.get(key)
  if (data === null) {
    // Initialize with seed data
    if (key === 'students') { await kv.set(key, SEED.students); return SEED.students }
    if (key === 'assignments') { await kv.set(key, SEED.assignments); return SEED.assignments }
    await kv.set(key, [])
    return []
  }
  return data
}

export async function setList(key, value) {
  await kv.set(key, value)
  return value
}

export async function addToList(key, item) {
  const list = await getList(key)
  list.push(item)
  await kv.set(key, list)
  return item
}

export async function updateInList(key, id, updates) {
  const list = await getList(key)
  const index = list.findIndex(item => item.id === id)
  if (index !== -1) {
    list[index] = { ...list[index], ...updates }
    await kv.set(key, list)
    return list[index]
  }
  return null
}
