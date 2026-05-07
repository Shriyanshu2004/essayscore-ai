import { getList, addToList, cors } from '../_db.js'

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    const { name, email, grade_level } = req.body
    const students = await getList('students')

    // Check duplicate email
    if (students.find(s => s.email === email)) {
      return res.status(400).json({ detail: 'Email already registered' })
    }

    const newStudent = {
      id: `stu-${Date.now()}`,
      name,
      email,
      grade_level: grade_level || '10',
      role: 'student',
      enrolled_at: new Date().toISOString(),
      status: 'active'
    }

    await addToList('students', newStudent)
    return res.status(200).json({ message: 'Student enrolled successfully', student_id: newStudent.id, student: newStudent })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
