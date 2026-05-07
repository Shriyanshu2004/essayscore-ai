import { getList, cors } from './_db.js'

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const assignments = await getList('assignments')
    return res.status(200).json(assignments)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
