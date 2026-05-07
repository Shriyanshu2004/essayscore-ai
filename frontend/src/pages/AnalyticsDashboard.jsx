import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { api } from '../api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, CartesianGrid
} from 'recharts'

const TT = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', fontSize:13 }}>
      {payload.map((p,i) => <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [dashData, setDashData] = useState(null)
  const [trends, setTrends] = useState([])
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    async function load() {
      const db = await api.get('/analytics/dashboard')
      if (db) setDashData(db)
      
      const tr = await api.get('/analytics/score-trends')
      if (tr) setTrends(tr)
      
      const rk = await api.get('/analytics/student-ranking')
      if (rk) setRanking(rk)
    }
    load()
  }, [])

  if (!dashData) {
    return (
      <>
        <Header title="Analytics Dashboard" subtitle="Class performance insights and scoring trends" />
        <div className="page-wrapper fade-in loading-center">
          <h2>Loading analytics...</h2>
        </div>
      </>
    )
  }

  // Map Dashboard Data to components
  const STATS = [
    { label:'Total Students', value: dashData.total_students, sub:'enrolled' },
    { label:'Submissions',    value: dashData.total_submissions, sub:'total' },
    { label:'Avg Score',      value: dashData.average_score, sub:'class average' },
    { label:'Scored',         value: dashData.scored_submissions, sub:`of ${dashData.total_submissions} submissions` },
  ]

  const DIST = Object.entries(dashData.score_distribution).map(([range, count]) => ({ range, count }))
  
  const TRAIT_AVG = Object.entries(dashData.trait_averages).map(([trait, score]) => ({ trait, score }))
  const RADAR = TRAIT_AVG.map(t => ({ subject: t.trait, score: t.score, fullMark: 100 }))

  // Trends might be per-day or per-submission, group by date for simple line chart
  // Or just show them chronologically
  const TREND = trends.map((t, idx) => ({ 
    label: `Sub ${idx+1}`, 
    avg: t.score,
    date: t.date,
    student: t.student
  }))

  const RANKING = ranking.slice(0, 8) // Top 8

  return (
    <>
      <Header title="Analytics Dashboard" subtitle="Class performance insights and scoring trends" />
      <div className="page-wrapper fade-in">
        <h1 className="page-title">📊 Analytics Dashboard</h1>
        <p className="page-sub">Real-time insights into student performance, trait distributions, and class trends.</p>

        {/* Stats Row */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 20, fontWeight: 600, fontSize: 15 }}>📈 Score Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DIST}>
                <XAxis dataKey="range" tick={{ fill:'#64748b', fontSize:12 }} />
                <YAxis tick={{ fill:'#64748b', fontSize:12 }} />
                <Tooltip content={<TT />} />
                <Bar dataKey="count" fill="#6366f1" radius={[6,6,0,0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 20, fontWeight: 600, fontSize: 15 }}>🎯 Average Score by Trait</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TRAIT_AVG} layout="vertical">
                <XAxis type="number" domain={[0,100]} tick={{ fill:'#64748b', fontSize:12 }} />
                <YAxis dataKey="trait" type="category" tick={{ fill:'#94a3b8', fontSize:12 }} width={85} />
                <Tooltip content={<TT />} />
                <Bar dataKey="score" fill="#22d3ee" radius={[0,6,6,0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 20, fontWeight: 600, fontSize: 15 }}>📅 Score Trend (Recent Submissions)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill:'#64748b', fontSize:12 }} />
                <YAxis domain={[0,100]} tick={{ fill:'#64748b', fontSize:12 }} />
                <Tooltip content={<TT />} />
                <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={3} dot={{ fill:'#6366f1', r:5 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 20, fontWeight: 600, fontSize: 15 }}>🕸️ Trait Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={RADAR}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill:'#94a3b8', fontSize:11 }} />
                <Radar dataKey="score" fill="rgba(99,102,241,0.3)" stroke="#6366f1" strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Ranking */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontWeight: 600, fontSize: 15 }}>🏆 Student Rankings</h3>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Rank</th><th>Student</th><th>Avg Score</th><th>Submissions</th>
              </tr></thead>
              <tbody>
                {RANKING.map(r => (
                  <tr key={r.rank}>
                    <td><span style={{ fontWeight:700, color: r.rank <= 3 ? 'var(--accent-warning)' : 'var(--text-muted)' }}>#{r.rank}</span></td>
                    <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{r.name}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontWeight:800, color:'var(--accent-primary)' }}>{r.average_score}</span>
                        <div className="progress-bar-track" style={{ width:80 }}>
                          <div className="progress-bar-fill" style={{ width:`${r.average_score}%`, background:'linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))' }} />
                        </div>
                      </div>
                    </td>
                    <td>{r.submission_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

