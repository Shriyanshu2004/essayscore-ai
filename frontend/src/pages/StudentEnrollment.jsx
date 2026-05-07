import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function StudentEnrollment() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    grade_level: '10',
    password: ''
  })
  
  const [status, setStatus] = useState(null) // null | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [studentId, setStudentId] = useState('')

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email) {
      setErrorMessage('Please fill in all required fields')
      setStatus('error')
      return
    }

    if (!formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await api.post('/students/enroll', formData)
      
      if (res && res.student_id) {
        setStudentId(res.student_id)
        setStatus('success')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/')
        }, 3000)
      } else {
        setErrorMessage('Enrollment failed. Please try again.')
        setStatus('error')
      }
    } catch (error) {
      setErrorMessage(error.message || 'Enrollment failed. Email may already be registered.')
      setStatus('error')
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
      padding: 20
    }}>
      <div className="card" style={{ 
        maxWidth: 500, 
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            marginBottom: 8,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎓 Student Enrollment
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Create your account to start submitting essays
          </p>
        </div>

        {status === 'success' && (
          <div className="alert alert-success" style={{ marginBottom: 24 }}>
            ✅ <div>
              <strong>Enrollment successful!</strong>
              <br />
              Your Student ID: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{studentId}</code>
              <br />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Redirecting to login page...
              </span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="alert alert-danger" style={{ marginBottom: 24 }}>
            ❌ <div>
              <strong>Enrollment failed</strong>
              <br />
              {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              className="input"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={status === 'submitting' || status === 'success'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="email"
              className="input"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={status === 'submitting' || status === 'success'}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Use this email to login after enrollment
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Grade Level</label>
            <select
              name="grade_level"
              className="select"
              value={formData.grade_level}
              onChange={handleChange}
              disabled={status === 'submitting' || status === 'success'}
            >
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
              <option value="college">College</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Password (Optional)</label>
            <input
              type="password"
              name="password"
              className="input"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              disabled={status === 'submitting' || status === 'success'}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Leave blank for demo mode (any password will work)
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={status === 'submitting' || status === 'success'}
          >
            {status === 'submitting' ? '⏳ Enrolling...' : status === 'success' ? '✅ Enrolled!' : '🚀 Enroll Now'}
          </button>
        </form>

        <div style={{ 
          marginTop: 24, 
          paddingTop: 24, 
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Login here
            </button>
          </p>
        </div>

        <div style={{ 
          marginTop: 24,
          padding: 16,
          background: 'var(--bg-elevated)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            📋 What you'll get:
          </h4>
          <ul style={{ 
            fontSize: 12, 
            color: 'var(--text-muted)', 
            paddingLeft: 20,
            margin: 0,
            lineHeight: 1.8
          }}>
            <li>Submit essays for automated scoring</li>
            <li>Get instant AI-powered feedback</li>
            <li>Track your writing progress over time</li>
            <li>Participate in peer reviews</li>
            <li>Access detailed analytics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
