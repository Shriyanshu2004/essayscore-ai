import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('essayScoreAuth')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('essayScoreAuth', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('essayScoreAuth')
    }
  }, [currentUser])

  function login(user) {
    setCurrentUser(user)
  }

  function logout() {
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
