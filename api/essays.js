import { getList, addToList, cors } from './_db.js'

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET /api/essays - list all essays
  if (req.method === 'GET') {
    const submissions = await getList('submissions')
    const students = await getList('students')
    const assignments = await getList('assignments')

    const studentsMap = Object.fromEntries(students.map(s => [s.id, s]))
    const assignmentsMap = Object.fromEntries(assignments.map(a => [a.id, a]))

    const result = submissions.map(sub => ({
      ...sub,
      student_name: studentsMap[sub.student_id]?.name || 'Unknown',
      assignment_title: assignmentsMap[sub.assignment_id]?.title || 'Unknown',
      has_content: true
    }))

    return res.status(200).json(result)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
