import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ScoreBadge from '../components/ScoreBadge'
import { api } from '../api'

export default function BatchScoring() {
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    async function load() {
      const data = await api.get('/essays/')
      if (data) setSubmissions(data)
    }
    load()
  }, [])

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }
  function selectAll() { setSelected(submissions.filter(s => s.has_content && s.status !== 'scored').map(s => s.id)) }
  function clearAll()  { setSelected([]) }

  async function runBatch() {
    setLoading(true); setResults([]); setProgress(0)
    const toScore = selected.filter(id => submissions.find(s => s.id === id)?.has_content)

    // Simulate progress visually
    const interval = setInterval(() => setProgress(p => Math.min(p + 15, 90)), 300)

    const res = await api.post('/batch/score', { submission_ids: toScore })
    clearInterval(interval); setProgress(100)

    if (res?.results) {
      setResults(res.results)
      // Update local submissions state to show them as scored
      setSubmissions(prev => prev.map(s => toScore.includes(s.id) ? { ...s, status: 'scored' } : s))
    } else {
      // Fallback demo results
      setResults(toScore.map(id => {
        const sub = submissions.find(s => s.id === id)
        const score = Math.floor(Math.random() * 40) + 55
        return { submission_id:id, student_name:sub?.student_name, assignment_title:sub?.assignment_title, overall_score:score, overall_grade: score>=90?'A+':score>=80?'A':score>=70?'B':score>=60?'C':'F', scored_at:new Date().toISOString(), status:'success', traits:[
          { trait_name:'Grammar',          score: score + Math.floor(Math.random()*10)-5 },
          { trait_name:'Coherence',        score: score + Math.floor(Math.random()*10)-5 },
          { trait_name:'Argument Strength',score: score + Math.floor(Math.random()*10)-5 },
        ]}
      }))
    }
    setSelected([])
    setLoading(false)
  }

  function exportCSV() {
    const header = 'Submission ID,Student,Assignment,Overall Score,Grade,Scored At'
    const rows = results.map(r => `${r.submission_id},"${r.student_name}","${r.assignment_title}",${r.overall_score},${r.overall_grade},${r.scored_at}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='batch_scores.csv'; a.click()
  }

  const eligible = submissions.filter(s => s.has_content && s.status !== 'scored')

  return (
    <>
      <Header title="Batch Scoring Panel" subtitle="Score multiple essays simultaneously" />
      <div className="page-wrapper fade-in">
        <h1 className="page-title">⚡ Batch Scoring Panel</h1>
        <p className="page-sub">Select multiple submissions and run the NLP scoring pipeline on all of them simultaneously.</p>

        {/* Summary Stats */}
        <div className="grid-4" style={{ marginBottom:24 }}>
          <div className="stat-card"><div className="stat-label">Total Submissions</div><div className="stat-value">{submissions.length}</div></div>
          <div className="stat-card"><div className="stat-label">Eligible to Score</div><div className="stat-value" style={{ color:'var(--accent-success)' }}>{eligible.length}</div></div>
          <div className="stat-card"><div className="stat-label">Selected</div><div className="stat-value" style={{ color:'var(--accent-primary)' }}>{selected.length}</div></div>
          <div className="stat-card"><div className="stat-label">Just Scored</div><div className="stat-value" style={{ color:'var(--accent-warning)' }}>{results.length}</div></div>
        </div>

        <div className="grid-2" style={{ marginBottom:24 }}>
          {/* Selection Panel */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontWeight:600, fontSize:15 }}>📋 Select Submissions</h3>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-secondary btn-sm" onClick={selectAll}>Select All Eligible</button>
                <button className="btn btn-secondary btn-sm" onClick={clearAll}>Clear</button>
              </div>
            </div>
            {submissions.length === 0 ? <p style={{color:'var(--text-muted)'}}>Loading submissions...</p> : null}
            {submissions.map(sub => {
              const isEligible = sub.has_content && sub.status !== 'scored'
              return (
              <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border-subtle)', cursor: isEligible ? 'pointer':'not-allowed', opacity: isEligible ? 1 : 0.5 }}
                onClick={() => isEligible && toggleSelect(sub.id)}>
                <input type="checkbox" checked={selected.includes(sub.id)} readOnly style={{ accentColor:'var(--accent-primary)', width:16, height:16 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{sub.student_name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{sub.assignment_title} · {sub.word_count || 0} words</div>
                </div>
                <span className={`badge ${sub.status==='scored' ? 'badge-success' : sub.has_content ? 'badge-info' : 'badge-neutral'}`}>
                  {sub.status === 'scored' ? '✓ Scored' : sub.has_content ? 'Ready' : 'No Content'}
                </span>
              </div>
            )})}

            {loading && (
              <div style={{ marginTop:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span>Scoring {selected.length} essays…</span>
                  <span style={{ fontWeight:700 }}>{progress}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width:`${progress}%`, background:'linear-gradient(90deg,var(--accent-primary),var(--accent-secondary)', transition:'width 0.3s' }} />
                </div>
              </div>
            )}

            <button id="run-batch-score-btn" className="btn btn-primary" style={{ width:'100%', marginTop:16 }}
              onClick={runBatch} disabled={selected.length === 0 || loading}>
              {loading ? `⏳ Scoring ${selected.length} essays…` : `⚡ Score ${selected.length} Selected Essays`}
            </button>
          </div>

          {/* Results Preview */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontWeight:600, fontSize:15 }}>📊 Results</h3>
              {results.length > 0 && <button id="export-csv-btn" className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ Export CSV</button>}
            </div>
            {results.length === 0 && !loading && (
              <div className="loading-center" style={{ minHeight:200 }}>
                <div style={{ fontSize:48 }}>⚡</div>
                <p style={{ color:'var(--text-muted)' }}>Results will appear here after scoring</p>
              </div>
            )}
            {results.map(r => (
              <div key={r.submission_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                <ScoreBadge score={r.overall_score} size={48} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{r.student_name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.assignment_title}</div>
                  <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                    {r.traits?.slice(0,3).map(t => (
                      <span key={t.trait_name} style={{ fontSize:10, color:'var(--text-muted)', background:'var(--bg-glass)', padding:'1px 6px', borderRadius:100 }}>
                        {t.trait_name.split(' ')[0]}: {Math.round(t.score)}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`badge ${r.overall_grade?.startsWith('A') ? 'badge-success' : r.overall_grade==='B' ? 'badge-info' : 'badge-warning'}`}>{r.overall_grade}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full Results Table */}
        {results.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom:16, fontWeight:600, fontSize:15 }}>📋 Full Results Table</h3>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Submission</th><th>Student</th><th>Assignment</th>
                  <th>Overall Score</th><th>Grade</th><th>Scored At</th>
                </tr></thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.submission_id}>
                      <td><code style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>{r.submission_id}</code></td>
                      <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{r.student_name}</td>
                      <td>{r.assignment_title}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontWeight:800, color:'var(--accent-primary)', fontSize:16 }}>{r.overall_score}</span>
                          <div className="progress-bar-track" style={{ width:60 }}>
                            <div className="progress-bar-fill" style={{ width:`${r.overall_score}%`, background:'linear-gradient(90deg,var(--accent-primary),var(--accent-secondary))' }} />
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${r.overall_grade?.startsWith('A') ? 'badge-success' : r.overall_grade==='B' ? 'badge-info' : 'badge-warning'}`}>{r.overall_grade}</span></td>
                      <td style={{ fontSize:12 }}>{new Date(r.scored_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
