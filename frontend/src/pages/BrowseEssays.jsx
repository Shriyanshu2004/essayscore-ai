import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function BrowseEssays() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [essays, setEssays] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'not-reviewed' | 'my-essays'

  useEffect(() => {
    loadEssays()
  }, [currentUser])

  async function loadEssays() {
    if (!currentUser) return
    
    setLoading(true)
    try {
      // Get all essays
      const res = await api.get('/essays')
      if (res && Array.isArray(res)) {
        setEssays(res)
      } else {
        console.error('Invalid response format:', res)
        setEssays([])
      }
    } catch (error) {
      console.error('Error loading essays:', error)
      setEssays([])
    } finally {
      setLoading(false)
    }
  }

  function handleReviewEssay(essay) {
    // Navigate to review page with essay ID
    navigate(`/review-essay/${essay.id}`)
  }

  const filteredEssays = essays.filter(essay => {
    if (filter === 'my-essays') {
      return essay.student_id === currentUser?.id
    }
    if (filter === 'not-reviewed') {
      // Show essays not by current user
      return essay.student_id !== currentUser?.id
    }
    return true // 'all'
  })

  return (
    <>
      <Header 
        title="Browse Essays" 
        subtitle="Read and review essays from other students"
      />
      <div className="page-wrapper fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 className="page-title">📚 Browse Essays</h1>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All Essays ({essays.length})
            </button>
            <button
              className={`btn ${filter === 'not-reviewed' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('not-reviewed')}
            >
              Available to Review
            </button>
            <button
              className={`btn ${filter === 'my-essays' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('my-essays')}
            >
              My Essays
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-center">
            <div className="spinner"></div>
            <p>Loading essays...</p>
          </div>
        )}

        {!loading && filteredEssays.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
            <h3 style={{ marginBottom: 8 }}>No essays found</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {filter === 'my-essays' 
                ? "You haven't submitted any essays yet."
                : "No essays available to review at the moment."}
            </p>
          </div>
        )}

        {!loading && filteredEssays.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
            {filteredEssays.map(essay => (
              <div key={essay.id} className="card" style={{ cursor: 'pointer' }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                        {essay.assignment_title}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        by {essay.student_name}
                      </p>
                    </div>
                    {essay.student_id === currentUser?.id && (
                      <span className="badge badge-info">Your Essay</span>
                    )}
                  </div>
                  
                  <div style={{ 
                    fontSize: 12, 
                    color: 'var(--text-muted)', 
                    marginBottom: 12,
                    display: 'flex',
                    gap: 16
                  }}>
                    <span>📅 {new Date(essay.submitted_at).toLocaleDateString()}</span>
                    <span>📝 {essay.word_count} words</span>
                    <span className={`badge badge-${essay.status === 'scored' ? 'success' : 'warning'}`}>
                      {essay.status}
                    </span>
                  </div>
                </div>

                <div style={{ 
                  padding: 12, 
                  background: 'var(--bg-elevated)', 
                  borderRadius: 8,
                  marginBottom: 12,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  maxHeight: 100,
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {essay.has_content ? (
                    <>
                      <div style={{ 
                        background: 'linear-gradient(to bottom, transparent 60%, var(--bg-elevated))',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 40
                      }} />
                      Click to read full essay...
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Essay content not available
                    </span>
                  )}
                </div>

                {essay.student_id !== currentUser?.id ? (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => handleReviewEssay(essay)}
                  >
                    👥 Review This Essay
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => navigate(`/feedback?submission=${essay.id}`)}
                  >
                    📊 View My Feedback
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
