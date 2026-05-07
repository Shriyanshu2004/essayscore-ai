import { useAuth } from '../context/AuthContext'

export default function Header({ title, subtitle }) {
  const { currentUser, logout } = useAuth()
  const initial = currentUser?.name?.charAt(0)?.toUpperCase() || '?'

  return (
    <header className="header">
      <div className="header-title">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">
        <span className="badge badge-success">● System Online</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {currentUser?.name || 'Guest'}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, cursor: 'pointer'
        }}>
          {initial}
        </div>
        <button 
          onClick={logout} 
          className="btn btn-secondary btn-sm" 
          style={{ marginLeft: 10, padding: '4px 10px', fontSize: 12 }}
        >
          Logout
        </button>
      </div>
    </header>
  )
}
