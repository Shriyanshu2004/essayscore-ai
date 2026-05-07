import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [role, setRole] = useState('student')
  const [students, setStudents] = useState([])
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    async function load() {
      const data = await api.get('/students/')
      if (data) {
        setStudents(data)
        if (data.length > 0) setStudentId(data[0].id)
      }
    }
    load()
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    if (role === 'teacher') {
      login({ id: 't-admin', name: 'Dr. Emily Hart', role: 'teacher' })
      navigate('/analytics')
    } else {
      const selected = students.find(s => s.id === studentId)
      if (selected) {
        login({ id: selected.id, name: selected.name, role: 'student' })
        navigate('/submit')
      }
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', background: 'var(--bg-main)', fontFamily: 'var(--font-sans)'
    }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Welcome to EssayScore AI</h1>
          <p style={{ color: 'var(--text-muted)' }}>Please select your role to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">I am a...</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="button" 
                className={`btn ${role === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setRole('student')}
              >
                Student
              </button>
              <button 
                type="button" 
                className={`btn ${role === 'teacher' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setRole('teacher')}
              >
                Teacher
              </button>
            </div>
          </div>

          {role === 'student' && (
            <div className="form-group fade-in" style={{ marginBottom: 24 }}>
              <label className="form-label">Select Your Name</label>
              <select 
                className="select" 
                value={studentId} 
                onChange={e => setStudentId(e.target.value)}
                required
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {role === 'teacher' && (
            <div className="form-group fade-in" style={{ marginBottom: 24 }}>
              <div className="alert alert-info">
                ℹ️ Logging in as demo teacher: <strong>Dr. Emily Hart</strong>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Login
          </button>
        </form>

        <div style={{ 
          marginTop: 24, 
          paddingTop: 24, 
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/enroll')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Enroll as Student
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
