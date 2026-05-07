import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function ReviewEssay() {
  const { essayId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [essay, setEssay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [review, setReview] = useState({
    grammar: 3,
    structure: 3,
    content: 3,
    comments: '',
    strength: '',
    improvement: ''
  })

  useEffect(() => {
    loadEssay()
  }, [essayId])

  async function loadEssay() {
    setLoading(true)
    const res = await api.get(`/essays/${essayId}`)
    if (res) {
      setEssay(res)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!currentUser || !essay) return

    setSubmitting(true)

    // First, assign the peer review
    await api.post(`/peer-review/assign?submission_id=${essayId}&reviewer_id=${currentUser.id}`)

    // Then submit the review
    const payload = {
      submission_id: essayId,
      reviewer_student_id: currentUser.id,
      grammar_score: review.grammar * 20, // Convert 1-5 to 20-100
      structure_score: review.structure * 20,
      content_score: review.content * 20,
      comments: review.comments,
      strength: review.strength,
      improvement: review.improvement
    }

    const res = await api.post('/peer-review/submit', payload)
    
    if (res) {
      setSubmitted(true)
      setTimeout(() => {
        navigate('/browse-essays')
      }, 2500)
    }
    
    setSubmitting(false)
  }

  if (loading) {
    return (
      <>
        <Header title="Review Essay" subtitle="Provide feedback to help your peer improve" />
        <div className="page-wrapper">
          <div className="loading-center">
            <div className="spinner"></div>
            <p>Loading essay...</p>
          </div>
        </div>
      </>
    )
  }

  if (!essay) {
    return (
      <>
        <Header title="Review Essay" subtitle="Provide feedback to help your peer improve" />
        <div className="page-wrapper">
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <h3>Essay not found</h3>
            <button className="btn btn-primary" onClick={() => navigate('/browse-essays')}>
              Back to Browse
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header 
        title={`Review: ${essay.assignment_title}`}
        subtitle={`by ${essay.student_name}`}
      />
      <div className="page-wrapper fade-in">
        {submitted && (
          <div className="alert alert-success" style={{ marginBottom: 24 }}>
            ✅ <div>
              <strong>Review submitted successfully!</strong>
              <br />
              Your feedback has been sent to {essay.student_name}. They will receive a notification.
            </div>
          </div>
        )}

        <div className="grid-2" style={{ gap: 24 }}>
          {/* Essay Content */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>
                📄 Essay Content
              </h3>
              <div style={{ 
                fontSize: 12, 
                color: 'var(--text-muted)', 
                marginBottom: 16,
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap'
              }}>
                <span>👤 {essay.student_name}</span>
                <span>📅 {new Date(essay.submitted_at).toLocaleDateString()}</span>
                <span>📝 {essay.word_count} words</span>
                <span>📊 {essay.sentence_count} sentences</span>
              </div>
              
              <div style={{
                padding: 16,
                background: 'var(--bg-elevated)',
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                maxHeight: 500,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                borderLeft: '3px solid var(--accent-primary)'
              }}>
                {essay.content}
              </div>
            </div>
          </div>

          {/* Review Form */}
          <div>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
                ✍️ Your Review
              </h3>

              <form onSubmit={handleSubmit}>
                {/* Score Sliders */}
                {[
                  ['grammar', 'Grammar & Mechanics'],
                  ['structure', 'Organization & Structure'],
                  ['content', 'Content & Argument']
                ].map(([key, label]) => (
                  <div key={key} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label className="form-label">{label}</label>
                      <span style={{ 
                        fontWeight: 800, 
                        fontSize: 18,
                        color: 'var(--accent-primary)' 
                      }}>
                        {review[key]}/5
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min={1} 
                      max={5} 
                      step={1} 
                      value={review[key]}
                      onChange={e => setReview(p => ({ ...p, [key]: Number(e.target.value) }))}
                      style={{ 
                        width: '100%', 
                        accentColor: 'var(--accent-primary)',
                        height: 8,
                        cursor: 'pointer'
                      }} 
                    />
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: 11, 
                      color: 'var(--text-muted)',
                      marginTop: 4
                    }}>
                      <span>Needs Work</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                ))}

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Overall Comments *</label>
                  <textarea 
                    className="textarea" 
                    style={{ minHeight: 120 }} 
                    required 
                    placeholder="Provide constructive feedback about the essay. What did you think? What worked well? What could be improved?" 
                    value={review.comments} 
                    onChange={e => setReview(p => ({ ...p, comments: e.target.value }))} 
                  />
                </div>
                
                <div className="grid-2" style={{ marginBottom: 20, gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">✅ One Strength</label>
                    <input 
                      className="input" 
                      placeholder="What did they do well?" 
                      value={review.strength} 
                      onChange={e => setReview(p => ({ ...p, strength: e.target.value }))} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">💡 One Improvement</label>
                    <input 
                      className="input" 
                      placeholder="What could be better?" 
                      value={review.improvement} 
                      onChange={e => setReview(p => ({ ...p, improvement: e.target.value }))} 
                    />
                  </div>
                </div>

                <div style={{ 
                  padding: 12, 
                  background: 'var(--bg-elevated)', 
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text-muted)'
                }}>
                  💡 <strong>Tip:</strong> Be constructive and specific. Focus on helping your peer improve their writing.
                </div>
                
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/browse-essays')}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    disabled={submitting || submitted}
                  >
                    {submitting ? '⏳ Submitting...' : submitted ? '✅ Submitted!' : '🚀 Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
