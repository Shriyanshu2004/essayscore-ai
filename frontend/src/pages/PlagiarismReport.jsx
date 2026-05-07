import { useState } from 'react'
import Header from '../components/Header'
import { api } from '../api'

const SUBMISSIONS_LIST = [
  { id:'sub-001', student:'Alice Johnson',  assignment:'Social Media Essay' },
  { id:'sub-002', student:'Bob Martinez',   assignment:'Social Media Essay' },
  { id:'sub-003', student:'Chloe Thompson', assignment:'Social Media Essay' },
]

const DEMO_RESULT = {
  overall_similarity: 18.4,
  flagged: false,
  risk_level: 'Low',
  internal_similarity: 12.1,
  external_similarity: 18.4,
  summary: 'No significant plagiarism detected. Overall similarity is 18.4%, which is within acceptable limits.',
  matched_passages: [
    { source_type:'external', source_title:'Wikipedia: Social Media and Mental Health', source_url:'https://en.wikipedia.org/wiki/Social_media_and_mental_health', similarity_score:0.42, matched_text:'heavy social media use correlates with increased rates of depression in teenagers', original_text:'Social media use has been linked to depression and anxiety in adolescents.', start_offset:280, end_offset:350 },
    { source_type:'external', source_title:'Psychology Today: Teen Social Media Use', source_url:'https://www.psychologytoday.com', similarity_score:0.38, matched_text:'three hours daily on social media were 35% more likely to report poor mental health', original_text:'spending more than three hours daily on social media are more likely to report poor mental health', start_offset:380, end_offset:470 },
  ]
}

export default function PlagiarismReport() {
  const [submissionId, setSubmissionId] = useState('sub-001')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function runCheck() {
    setLoading(true)
    const res = await api.post(`/plagiarism/check/${submissionId}`)
    setResult(res || DEMO_RESULT)
    setLoading(false)
  }

  const risk = result?.risk_level || 'Minimal'
  const riskColor = { Minimal:'var(--accent-success)', Low:'var(--accent-success)', Moderate:'var(--accent-warning)', High:'var(--accent-danger)' }
  const sim = result?.overall_similarity || 0
  const simColor = sim >= 50 ? 'var(--accent-danger)' : sim >= 25 ? 'var(--accent-warning)' : 'var(--accent-success)'

  return (
    <>
      <Header title="Plagiarism Report" subtitle="Detect similarity against internal corpus and external sources" />
      <div className="page-wrapper fade-in">
        <h1 className="page-title">🔍 Plagiarism Detection</h1>
        <p className="page-sub">Compare essays against the internal submission database and external web sources using TF-IDF similarity analysis.</p>

        <div style={{ display:'flex', gap:12, marginBottom:24, alignItems:'center' }}>
          <select id="plag-submission-select" className="select" style={{ maxWidth:280 }} value={submissionId} onChange={e => setSubmissionId(e.target.value)}>
            {SUBMISSIONS_LIST.map(s => <option key={s.id} value={s.id}>{s.student} — {s.assignment}</option>)}
          </select>
          <button id="run-plagiarism-btn" className="btn btn-primary" onClick={runCheck} disabled={loading}>
            {loading ? '⏳ Analyzing…' : '🔍 Run Plagiarism Check'}
          </button>
        </div>

        {!result && !loading && (
          <div className="card loading-center" style={{ minHeight:300 }}>
            <div style={{ fontSize:56 }}>🔍</div>
            <p style={{ color:'var(--text-muted)' }}>Select a submission and click "Run Plagiarism Check"</p>
          </div>
        )}

        {loading && <div className="loading-center"><div className="spinner" /><p>Analyzing essay similarity…</p></div>}

        {result && !loading && (
          <>
            {/* Summary Cards */}
            <div className="grid-4" style={{ marginBottom:24 }}>
              <div className="card" style={{ textAlign:'center', borderColor: result.flagged ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                <div style={{ fontSize:48, marginBottom:8 }}>{result.flagged ? '🚨' : '✅'}</div>
                <div style={{ fontWeight:800, fontSize:16, color: result.flagged ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                  {result.flagged ? 'FLAGGED' : 'CLEAR'}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Overall Status</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Overall Similarity</div>
                <div className="stat-value" style={{ color: simColor }}>{sim.toFixed(1)}%</div>
                <div className="progress-bar-track" style={{ marginTop:8 }}>
                  <div className="progress-bar-fill" style={{ width:`${sim}%`, background: simColor }} />
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Internal Similarity</div>
                <div className="stat-value" style={{ color:'var(--accent-secondary)' }}>{result.internal_similarity?.toFixed(1)}%</div>
                <div className="stat-sub">vs. class submissions</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Risk Level</div>
                <div className="stat-value" style={{ color: riskColor[risk] }}>{risk}</div>
                <div className="stat-sub">{result.matched_passages?.length || 0} matches found</div>
              </div>
            </div>

            <div className="alert alert-info" style={{ marginBottom:24 }}>
              ℹ️ {result.summary}
            </div>

            {/* Matched Passages */}
            {result.matched_passages?.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom:16, fontWeight:600 }}>📄 Matched Passages</h3>
                {result.matched_passages.map((match, i) => (
                  <div key={i} style={{ padding:'16px 0', borderBottom: i < result.matched_passages.length-1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <div>
                        <span className={`badge ${match.source_type==='external' ? 'badge-warning' : 'badge-danger'}`}>{match.source_type}</span>
                        <span style={{ marginLeft:8, fontSize:13, fontWeight:600 }}>{match.source_title}</span>
                      </div>
                      <span style={{ fontWeight:800, color:'var(--accent-warning)', fontSize:16 }}>{(match.similarity_score*100).toFixed(0)}%</span>
                    </div>
                    <div className="grid-2" style={{ gap:16 }}>
                      <div>
                        <div style={{ fontSize:11, color:'var(--accent-danger)', fontWeight:600, marginBottom:4 }}>STUDENT TEXT</div>
                        <p style={{ fontSize:13, color:'var(--text-secondary)', background:'rgba(239,68,68,0.07)', padding:'8px 12px', borderRadius:8, borderLeft:'2px solid var(--accent-danger)' }}>
                          "…{match.matched_text}…"
                        </p>
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:'var(--accent-warning)', fontWeight:600, marginBottom:4 }}>SOURCE TEXT</div>
                        <p style={{ fontSize:13, color:'var(--text-secondary)', background:'rgba(245,158,11,0.07)', padding:'8px 12px', borderRadius:8, borderLeft:'2px solid var(--accent-warning)' }}>
                          "…{match.original_text}…"
                        </p>
                      </div>
                    </div>
                    {match.source_url && <a href={match.source_url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--accent-secondary)', marginTop:8, display:'block' }}>🔗 {match.source_url}</a>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
