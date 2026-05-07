import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ScoreBadge from '../components/ScoreBadge'
import { api } from '../api'

const DEMO_SCORING = {
  overall_score: 84,
  overall_grade: 'A',
  traits: [
    { trait_name: 'Grammar',          score: 88, max_score: 100, grade: 'A' },
    { trait_name: 'Coherence',        score: 90, max_score: 100, grade: 'A+' },
    { trait_name: 'Vocabulary',       score: 82, max_score: 100, grade: 'A' },
    { trait_name: 'Argument Strength', score: 85, max_score: 100, grade: 'A' },
    { trait_name: 'Style',            score: 75, max_score: 100, grade: 'B' },
  ],
  feedback: {
    holistic_feedback: "This is an outstanding essay that demonstrates sophisticated writing skills across all evaluated dimensions. Your argument is compelling, your evidence well-chosen, and your prose polished. Pay particular attention to improving your style, which is your area of greatest growth potential. Your coherence is your strongest dimension—continue building on this strength.",
    trait_feedback: [
      { trait_name: 'Grammar', score: 88, feedback: 'Your writing demonstrates strong command of grammar and mechanics.', strengths: ['Consistent capitalization', 'Correct subject-verb agreement'], improvements: ['Watch for occasional article errors'] },
      { trait_name: 'Coherence', score: 90, feedback: 'Your essay is exceptionally well-organized with smooth transitions.', strengths: ['Clear three-part structure', 'Effective transition words'], improvements: ['Consider varying transition vocabulary'] },
      { trait_name: 'Vocabulary', score: 82, feedback: 'You demonstrate an impressive and varied vocabulary.', strengths: ['High lexical diversity', 'Precise terminology'], improvements: ['Occasionally vary most-used phrases'] },
      { trait_name: 'Argument Strength', score: 85, feedback: 'Your argument is logically structured and persuasive.', strengths: ['Clear thesis statement', 'Strong evidence', 'Counterargument addressed'], improvements: ['Add more evidence diversity'] },
      { trait_name: 'Style', score: 75, feedback: 'Your writing style is functional but could be more engaging.', strengths: ['Appropriate academic tone'], improvements: ['Reduce passive voice', 'Vary sentence openings'] },
    ],
    annotations: [
      { start_offset: 0, end_offset: 12, annotation_type: 'grammar', severity: 'info', message: 'Strong opening sentence', suggestion: 'Well done' },
      { start_offset: 147, end_offset: 160, annotation_type: 'style', severity: 'info', message: 'Consider active voice here', suggestion: 'Rewrite in active voice' },
      { start_offset: 380, end_offset: 410, annotation_type: 'grammar', severity: 'warning', message: 'Verify their/there usage', suggestion: "Check 'their' usage" },
    ]
  }
}

const TRAIT_COLORS = {
  Grammar: '#10b981', Coherence: '#6366f1', Vocabulary: '#22d3ee',
  'Argument Strength': '#f59e0b', Style: '#a855f7'
}

export default function FeedbackViewer() {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeTrait, setActiveTrait] = useState(null)
  const [submissionId, setSubmissionId] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [essayContent, setEssayContent] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load available submissions on mount
  useEffect(() => {
    loadSubmissions()
  }, [])

  // Load essay content when submission changes
  useEffect(() => {
    if (submissionId) {
      loadEssayContent()
    }
  }, [submissionId])

  async function loadSubmissions() {
    const res = await api.get('/essays')
    if (res && Array.isArray(res)) {
      setSubmissions(res)
      if (res.length > 0) {
        setSubmissionId(res[0].id)
      }
    }
  }

  async function loadEssayContent() {
    const res = await api.get(`/essays/${submissionId}`)
    if (res && res.content) {
      setEssayContent(res.content)
    }
  }

  async function loadFeedback() {
    if (!submissionId) return
    setLoading(true)
    try {
      const res = await api.post(`/scoring/score/${submissionId}`)
      if (res) {
        setData(res)
      }
    } catch (error) {
      console.error('Error loading feedback:', error)
      alert('Failed to load feedback. Please try again.')
    }
    setLoading(false)
  }

  function renderAnnotatedEssay() {
    const annotations = data?.feedback?.annotations || []
    const text = essayContent || 'No essay content available. Please select a submission and click "Score & Load Feedback".'
    if (!annotations.length) return <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{text}</p>

    let parts = [], last = 0
    const sorted = [...annotations].sort((a,b) => a.start_offset - b.start_offset)
    sorted.forEach((ann, i) => {
      if (ann.start_offset > last) parts.push(<span key={`t${i}`}>{text.slice(last, ann.start_offset)}</span>)
      const cls = `annotation-${ann.severity === 'error' ? 'error' : ann.annotation_type === 'style' ? 'style' : ann.severity === 'warning' ? 'warning' : 'info'}`
      parts.push(
        <span key={`a${i}`} className={cls} title={`${ann.message}${ann.suggestion ? ' → ' + ann.suggestion : ''}`}>
          {text.slice(ann.start_offset, ann.end_offset)}
        </span>
      )
      last = ann.end_offset
    })
    if (last < text.length) parts.push(<span key="end">{text.slice(last)}</span>)
    return <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{parts}</p>
  }

  return (
    <>
      <Header title="Feedback Viewer" subtitle="AI-generated scores and detailed writing feedback" />
      <div className="page-wrapper fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <select id="submission-select" className="select" style={{ maxWidth: 300 }} value={submissionId} onChange={e => setSubmissionId(e.target.value)}>
            {submissions.length === 0 && <option value="">No submissions yet</option>}
            {submissions.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.student_name} — {sub.assignment_title}
              </option>
            ))}
          </select>
          <button id="load-feedback-btn" className="btn btn-primary" onClick={loadFeedback} disabled={loading || !submissionId}>
            {loading ? '⏳ Scoring…' : '🔍 Score & Load Feedback'}
          </button>
        </div>

        {!data && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <h3 style={{ marginBottom: 12 }}>👆 Select a submission and click "Score & Load Feedback"</h3>
            <p style={{ color: 'var(--text-muted)' }}>The AI will analyze the essay and provide detailed feedback</p>
          </div>
        )}

        {data && (
          <>
            {/* Score Overview Row */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="card" style={{ gridColumn: '1/2', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                <ScoreBadge score={data.overall_score} size={100} />
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>Grade {data.overall_grade}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Score</div>
                </div>
              </div>
              {data.traits.map(t => (
                <div key={t.trait_name} className="card" onClick={() => { setActiveTrait(t.trait_name); setActiveTab('traits') }}
                  style={{ cursor:'pointer', borderColor: activeTrait===t.trait_name ? TRAIT_COLORS[t.trait_name] : undefined }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{t.trait_name}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: TRAIT_COLORS[t.trait_name] }}>{t.score}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Grade {t.grade}</div>
                  <div className="progress-bar-track" style={{ marginTop: 8 }}>
                    <div className="progress-bar-fill" style={{ width: `${t.score}%`, background: TRAIT_COLORS[t.trait_name] }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="tabs">
              {['overview','essay','traits','annotations'].map(tab => (
                <button key={tab} className={`tab-btn${activeTab===tab?' active':''}`} onClick={() => setActiveTab(tab)}>
                  {tab === 'overview' ? '📊 Overview' : tab === 'essay' ? '📄 Annotated Essay' : tab === 'traits' ? '🎯 Trait Feedback' : '💡 Annotations'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="card fade-in">
                <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600 }}>🗒️ Holistic Feedback</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>{data.feedback?.holistic_feedback}</p>
              </div>
            )}

            {activeTab === 'essay' && (
              <div className="card fade-in">
                <div style={{ display:'flex', gap:16, marginBottom: 16, fontSize: 12 }}>
                  <span className="annotation-error" style={{ padding:'2px 6px' }}>Grammar Error</span>
                  <span className="annotation-warning" style={{ padding:'2px 6px' }}>Warning</span>
                  <span className="annotation-style" style={{ padding:'2px 6px' }}>Style</span>
                  <span className="annotation-info" style={{ padding:'2px 6px' }}>Info</span>
                  <span style={{ color:'var(--text-muted)' }}>Hover over highlights for details</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                  {renderAnnotatedEssay()}
                </div>
              </div>
            )}

            {activeTab === 'traits' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="fade-in">
                {(data.feedback?.trait_feedback || []).map(tf => (
                  <div key={tf.trait_name} className="card" style={{ borderLeft: `3px solid ${TRAIT_COLORS[tf.trait_name]}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 12 }}>
                      <h3 style={{ fontWeight: 700 }}>{tf.trait_name}</h3>
                      <span style={{ fontSize: 24, fontWeight: 800, color: TRAIT_COLORS[tf.trait_name] }}>{tf.score}/100</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>{tf.feedback}</p>
                    <div className="grid-2">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-success)', marginBottom: 8 }}>✅ Strengths</div>
                        {(tf.strengths||[]).map(s => <div key={s} style={{ fontSize: 13, color:'var(--text-secondary)', padding:'4px 0' }}>• {s}</div>)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-warning)', marginBottom: 8 }}>💡 Areas for Improvement</div>
                        {(tf.improvements||[]).map(i => <div key={i} style={{ fontSize: 13, color:'var(--text-secondary)', padding:'4px 0' }}>• {i}</div>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'annotations' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }} className="fade-in">
                {(data.feedback?.annotations || []).map((ann, i) => (
                  <div key={i} className="card card-sm" style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <span className={`badge badge-${ann.severity === 'error' ? 'danger' : ann.severity === 'warning' ? 'warning' : 'info'}`}>
                      {ann.severity}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ann.message}</div>
                      {ann.suggestion && <div style={{ fontSize: 12, color:'var(--text-muted)', marginTop: 4 }}>Suggestion: {ann.suggestion}</div>}
                    </div>
                  </div>
                ))}
                {(!data.feedback?.annotations?.length) && (
                  <div className="loading-center"><p>No annotations available for this essay.</p></div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
