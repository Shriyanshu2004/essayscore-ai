import { getList, addToList, cors } from './_db.js'

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET /api/students/ - list all students
  if (req.method === 'GET') {
    const students = await getList('students')
    return res.status(200).json(students)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
