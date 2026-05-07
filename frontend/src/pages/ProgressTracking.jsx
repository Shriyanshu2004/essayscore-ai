import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ScoreBadge from '../components/ScoreBadge'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', fontSize:13 }}>
      <div style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:'var(--accent-primary)', fontWeight:700 }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

export default function ProgressTracking() {
  const { currentUser } = useAuth()
  
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [studentId, setStudentId] = useState('')
  const [progressData, setProgressData] = useState(null)

  useEffect(() => {
    async function load() {
      const studs = await api.get('/students/')
      if (studs) {
        setStudents(studs)
        if (currentUser?.role === 'student') {
          setStudentId(currentUser.id)
        } else if (studs.length > 0) {
          setStudentId(studs[0].id)
        }
      }
      
      const asgns = await api.get('/assignments/')
      if (asgns) setAssignments(asgns)
    }
    load()
  }, [currentUser])

  useEffect(() => {
    async function loadProgress() {
      if (!studentId) return
      const prog = await api.get(`/students/${studentId}/progress`)
      if (prog) setProgressData(prog)
    }
    loadProgress()
  }, [studentId])

  if (!progressData) {
    return (
      <>
        <Header title="Progress Tracking" subtitle="Track student writing improvement over time" />
        <div className="page-wrapper fade-in loading-center">
          <h2>Loading student progress...</h2>
        </div>
      </>
    )
  }

  const entries = progressData.progress_entries.map(p => {
    const asgn = assignments.find(a => a.id === p.assignment_id)
    return {
      date: new Date(p.submitted_at).toLocaleDateString(),
      score: p.percentage,
      assignment: asgn ? asgn.title : p.assignment_id,
      traits: p.trait_breakdown || {}
    }
  }).sort((a,b) => new Date(a.date) - new Date(b.date))

  const latest = entries[entries.length - 1]
  const first   = entries[0]
  const improvement = latest && first ? (latest.score - first.score).toFixed(1) : 0

  const radarData = latest ? Object.entries(latest.traits).map(([k,v]) => ({ subject:k.replace('Argument Strength','Argument'), score:v, fullMark:100 })) : []

  return (
    <>
      <Header title="Progress Tracking" subtitle="Track student writing improvement over time" />
      <div className="page-wrapper fade-in">
        <div style={{ display:'flex', gap:16, marginBottom: 28, alignItems:'center' }}>
          <div>
            <h1 className="page-title">📈 Progress Tracking</h1>
            <p className="page-sub">Monitor writing skill development across assignments and time.</p>
          </div>
          
          {currentUser?.role === 'student' ? (
            <div style={{ padding: '8px 16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, marginLeft: 'auto' }}>
              Viewing as: {currentUser.name}
            </div>
          ) : (
            <select id="student-progress-select" className="select" style={{ maxWidth:220, marginLeft:'auto' }} value={studentId} onChange={e => setStudentId(e.target.value)}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-label">Current Score</div>
            <div className="stat-value" style={{ color:'var(--accent-primary)' }}>{latest?.score ?? '—'}</div>
            <div className="stat-sub">Latest assignment</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Improvement</div>
            <div className="stat-value" style={{ color: improvement >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {improvement >= 0 ? '+' : ''}{improvement}
            </div>
            <div className="stat-sub">Since first submission</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Assignments</div>
            <div className="stat-value">{entries.length}</div>
            <div className="stat-sub">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Best Score</div>
            <div className="stat-value" style={{ color:'var(--accent-success)' }}>
              {entries.length ? Math.max(...entries.map(e => e.score)) : '—'}
            </div>
            <div className="stat-sub">All time</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Score Timeline */}
          <div className="card">
            <h3 style={{ marginBottom: 20, fontWeight:600, fontSize:15 }}>📅 Score Timeline</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={entries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:11 }} />
                <YAxis domain={[0,100]} tick={{ fill:'#64748b', fontSize:12 }} />
                <Tooltip content={<TT />} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ fill:'#6366f1', r:6 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="card">
            <h3 style={{ marginBottom: 20, fontWeight:600, fontSize:15 }}>🕸️ Latest Trait Profile</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill:'#94a3b8', fontSize:11 }} />
                <Radar dataKey="score" fill="rgba(34,211,238,0.25)" stroke="#22d3ee" strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Submission History */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontWeight:600, fontSize:15 }}>📋 Submission History</h3>
          {entries.length === 0 && <p style={{ color:'var(--text-muted)' }}>No scored submissions yet.</p>}
          {[...entries].reverse().map((entry, idx, arr) => (
            <div key={idx} style={{ display:'flex', alignItems:'center', gap:20, padding:'16px 0', borderBottom: idx < arr.length-1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <ScoreBadge score={entry.score} size={56} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{entry.assignment}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{entry.date}</div>
                <div style={{ display:'flex', gap:8, marginTop: 8, flexWrap:'wrap' }}>
                  {Object.entries(entry.traits).map(([k,v]) => (
                    <span key={k} style={{ fontSize:11, color:'var(--text-secondary)', background:'var(--bg-glass)', padding:'2px 8px', borderRadius:100, border:'1px solid var(--border-subtle)' }}>
                      {k.split(' ')[0]}: {v}
                    </span>
                  ))}
                </div>
              </div>
              {idx < arr.length - 1 && (
                <span style={{ fontWeight:700, color: entry.score >= arr[idx+1].score ? 'var(--accent-success)' : 'var(--accent-danger)', fontSize:16 }}>
                  {entry.score >= arr[idx+1].score ? '↑' : '↓'} {Math.abs(entry.score - arr[idx+1].score).toFixed(1)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
