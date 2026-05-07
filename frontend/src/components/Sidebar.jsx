import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

const NAV = [
  { section: 'Student', items: [
    { to: '/submit',    icon: '✍️', label: 'Essay Submission' },
    { to: '/feedback',  icon: '💬', label: 'Feedback Viewer' },
    { to: '/progress',  icon: '📈', label: 'Progress Tracking' },
    { to: '/browse-essays', icon: '📚', label: 'Browse Essays' },
    { to: '/peer',      icon: '👥', label: 'Peer Review' },
    { to: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
  ]},
  { section: 'Teacher', items: [
    { to: '/calibration', icon: '⚖️', label: 'Calibration Tool' },
    { to: '/rubric',      icon: '📋', label: 'Rubric Builder' },
    { to: '/batch',       icon: '⚡', label: 'Batch Scoring' },
  ]},
  { section: 'Insights', items: [
    { to: '/analytics',   icon: '📊', label: 'Analytics Dashboard' },
    { to: '/plagiarism',  icon: '🔍', label: 'Plagiarism Report' },
    { to: '/style',       icon: '🎨', label: 'Style Analyzer' },
  ]},
]

export default function Sidebar() {
  const { currentUser } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  async function loadUnreadCount() {
    if (!currentUser) return
    try {
      const res = await api.get(`/peer-review/notifications/${currentUser.id}/unread`)
      if (res && res.count !== undefined) {
        setUnreadCount(res.count)
      }
    } catch (error) {
      // Silently fail - don't block UI
    }
  }

  const visibleNav = NAV.filter(section => {
    if (currentUser?.role === 'teacher') return true
    return section.section === 'Student' || section.section === 'Insights'
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        <h1>EssayScore AI</h1>
        <p>NLP Writing Assessment</p>
      </div>
      <nav className="sidebar-nav">
        {visibleNav.map(section => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge && unreadCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    background: 'var(--accent-danger)',
                    color: 'white',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
