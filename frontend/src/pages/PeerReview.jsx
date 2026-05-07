import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function PeerReview() {
  const { currentUser } = useAuth()
  
  const [queue, setQueue] = useState([])
  const [selected, setSelected] = useState(null)
  const [essayContent, setEssayContent] = useState('')
  const [form, setForm] = useState({ 
    grammar: 3, 
    structure: 3, 
    content: 3, 
    comments: '', 
    strength: '', 
    improvement: '' 
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviewQueue()
  }, [currentUser])

  useEffect(() => {
    if (selected) {
      loadEssayContent()
    }
  }, [selected])

  async function loadReviewQueue() {
    if (!currentUser) return
    
    setLoading(true)
    const res = await api.get(`/peer-review/queue/${currentUser.id}`)
    if (res && Array.isArray(res)) {
      // Enrich with submission details
      const enriched = await Promise.all(
        res.map(async (pr) => {
          const submission = await api.get(`/essays/${pr.submission_id}`)
          return {
            ...pr,
            author: submission?.student_name || 'Unknown',
            assignment: submission?.assignment_title || 'Unknown Assignment'
          }
        })
      )
      setQueue(enriched)
    }
    setLoading(false)
  }

  async function loadEssayContent() {
    if (!selected) return
    
    const res = await api.get(`/essays/${selected.submission_id}`)
    if (res && res.content) {
      setEssayContent(res.content)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!selected || !currentUser) return

    const payload = {
      submission_id: selected.submission_id,
      reviewer_student_id: currentUser.id,
      grammar_score: form.grammar * 20, // Convert 1-5 to 20-100
      structure_score: form.structure * 20,
      content_score: form.content * 20,
      comments: form.comments,
      strength: form.strength,
      improvement: form.improvement
    }

    const res = await api.post('/peer-review/submit', payload)
    
    if (res) {
      setSubmitted(true)
      setTimeout(() => { 
        setSubmitted(false)
        setSelected(null)
        setForm({ grammar: 3, structure: 3, content: 3, comments: '', strength: '', improvement: '' })
        loadReviewQueue() // Reload queue
      }, 2500)
    }
  }

  const statusColor = { pending: 'badge-warning', in_progress: 'badge-info', completed: 'badge-success' }

  return (
    <>
      <Header title="Peer Review" subtitle="Assign and complete peer reviews for essay submissions" />
      <div className="page-wrapper fade-in">
        <h1 className="page-title">👥 Peer Review</h1>
        <p className="page-sub">Review your peers' essays and provide constructive feedback to help them improve.</p>

        {submitted && (
          <div className="alert alert-success">
            ✅ Peer review submitted successfully! Your feedback has been sent to {selected?.author}.
          </div>
        )}

        {loading && (
          <div className="loading-center">
            <div className="spinner"></div>
            <p>Loading review queue...</p>
          </div>
        )}

        {!loading && queue.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
            <h3 style={{ marginBottom: 8 }}>No pending reviews</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              You don't have any essays assigned for peer review at the moment.
            </p>
          </div>
        )}

        {!loading && queue.length > 0 && (
          <div className="grid-2">
            {/* Queue */}
            <div>
              <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                REVIEW QUEUE ({queue.length})
              </div>
              {queue.map(pr => (
                <div 
                  key={pr.id} 
                  className="card" 
                  style={{ 
                    marginBottom: 12, 
                    cursor: pr.status !== 'completed' ? 'pointer' : 'default', 
                    borderColor: selected?.id === pr.id ? 'var(--accent-primary)' : undefined 
                  }} 
                  onClick={() => pr.status !== 'completed' && setSelected(pr)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Essay by {pr.author}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pr.assignment}</div>
                    </div>
                    <span className={`badge ${statusColor[pr.status]}`}>
                      {pr.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Assigned: {new Date(pr.assigned_at).toLocaleDateString()}
                  </div>
                  {pr.status !== 'completed' && (
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ marginTop: 10 }} 
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected(pr)
                      }}
                    >
                      {pr.status === 'in_progress' ? 'Continue Review' : 'Start Review'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Review Form */}
            <div>
              {selected ? (
                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Reviewing: {selected.author}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{selected.assignment}</p>

                  {/* Essay Preview */}
                  <div style={{ 
                    background: 'var(--bg-surface)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: 16, 
                    marginBottom: 20, 
                    fontSize: 13, 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.8, 
                    borderLeft: '3px solid var(--accent-primary)',
                    maxHeight: 300,
                    overflowY: 'auto'
                  }}>
                    {essayContent || 'Loading essay content...'}
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* Score Sliders */}
                    {[
                      ['grammar', 'Grammar & Mechanics'],
                      ['structure', 'Organization & Structure'],
                      ['content', 'Content & Argument']
                    ].map(([key, label]) => (
                      <div key={key} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <label className="form-label">{label}</label>
                          <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>
                            {form[key]}/5
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min={1} 
                          max={5} 
                          step={1} 
                          value={form[key]}
                          onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                          style={{ width: '100%', accentColor: 'var(--accent-primary)' }} 
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                          <span>Needs Work</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    ))}

                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Overall Comments *</label>
                      <textarea 
                        className="textarea" 
                        style={{ minHeight: 100 }} 
                        required 
                        placeholder="Provide constructive overall feedback..." 
                        value={form.comments} 
                        onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} 
                      />
                    </div>
                    
                    <div className="grid-2" style={{ marginBottom: 16 }}>
                      <div className="form-group">
                        <label className="form-label">✅ One Strength</label>
                        <input 
                          className="input" 
                          placeholder="What did they do well?" 
                          value={form.strength} 
                          onChange={e => setForm(p => ({ ...p, strength: e.target.value }))} 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">💡 One Improvement</label>
                        <input 
                          className="input" 
                          placeholder="What could be better?" 
                          value={form.improvement} 
                          onChange={e => setForm(p => ({ ...p, improvement: e.target.value }))} 
                        />
                      </div>
                    </div>
                    
                    <button 
                      id="submit-peer-review-btn" 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                    >
                      Submit Peer Review
                    </button>
                  </form>
                </div>
              ) : (
                <div className="card loading-center" style={{ minHeight: 400 }}>
                  <div style={{ fontSize: 48 }}>👈</div>
                  <p style={{ color: 'var(--text-muted)' }}>Select a review from the queue to begin</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
