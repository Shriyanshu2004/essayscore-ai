import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Notifications() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unread'

  useEffect(() => {
    loadNotifications()
  }, [currentUser])

  async function loadNotifications() {
    if (!currentUser) return
    
    setLoading(true)
    const res = await api.get(`/peer-review/notifications/${currentUser.id}`)
    if (res && Array.isArray(res)) {
      setNotifications(res)
    }
    setLoading(false)
  }

  async function markAsRead(notificationId) {
    await api.post(`/peer-review/notifications/${notificationId}/mark-read`)
    // Update local state
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ))
  }

  function viewReview(notification) {
    markAsRead(notification.id)
    // Navigate to feedback viewer with the submission
    navigate(`/feedback?submission=${notification.submission_id}`)
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <Header 
        title="Notifications" 
        subtitle="Peer review feedback and system updates"
      />
      <div className="page-wrapper fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 className="page-title">
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 12,
                padding: '4px 12px',
                background: 'var(--accent-danger)',
                color: 'white',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600
              }}>
                {unreadCount} new
              </span>
            )}
          </h1>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-center">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        )}

        {!loading && filteredNotifications.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
            <h3 style={{ marginBottom: 8 }}>No notifications</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        )}

        {!loading && filteredNotifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderLeft: notification.read ? '3px solid var(--border)' : '3px solid var(--accent-primary)',
                  background: notification.read ? 'var(--bg-card)' : 'var(--bg-elevated)',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => viewReview(notification)}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: notification.read 
                      ? 'var(--bg-elevated)' 
                      : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0
                  }}>
                    {notification.type === 'peer_review' ? '👥' : '🔔'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <h3 style={{ 
                          fontSize: 16, 
                          fontWeight: notification.read ? 600 : 700,
                          marginBottom: 4 
                        }}>
                          {notification.title}
                        </h3>
                        <p style={{ 
                          fontSize: 14, 
                          color: 'var(--text-secondary)',
                          marginBottom: 8
                        }}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <span style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: 'var(--accent-primary)',
                          flexShrink: 0
                        }} />
                      )}
                    </div>

                    {/* Review Details */}
                    {notification.type === 'peer_review' && (
                      <div style={{ 
                        padding: 12, 
                        background: 'var(--bg-main)', 
                        borderRadius: 8,
                        marginBottom: 12
                      }}>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reviewer</span>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {notification.reviewer_name}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Score</span>
                            <div style={{ 
                              fontWeight: 700, 
                              fontSize: 18,
                              color: notification.overall_score >= 80 ? 'var(--accent-success)' : 
                                     notification.overall_score >= 60 ? 'var(--accent-warning)' : 
                                     'var(--accent-danger)'
                            }}>
                              {notification.overall_score}/100
                            </div>
                          </div>
                        </div>

                        {notification.comments && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                              💬 Comments
                            </div>
                            <p style={{ 
                              fontSize: 13, 
                              color: 'var(--text-secondary)',
                              fontStyle: 'italic',
                              lineHeight: 1.6
                            }}>
                              "{notification.comments}"
                            </p>
                          </div>
                        )}

                        <div className="grid-2" style={{ marginTop: 12, gap: 12 }}>
                          {notification.strength && (
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--accent-success)', fontWeight: 600, marginBottom: 4 }}>
                                ✅ Strength
                              </div>
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {notification.strength}
                              </p>
                            </div>
                          )}
                          {notification.improvement && (
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--accent-warning)', fontWeight: 600, marginBottom: 4 }}>
                                💡 Improvement
                              </div>
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {notification.improvement}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: 12,
                      color: 'var(--text-muted)'
                    }}>
                      <span>
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          viewReview(notification)
                        }}
                      >
                        View Full Review →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
