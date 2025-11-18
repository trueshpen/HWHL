import { useState, useEffect } from 'react'
import './PasswordProtection.css'

const CORRECT_PASSWORD = '190789'

function PasswordProtection({ onAuthenticated }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if already authenticated in this session
  useEffect(() => {
    const authStatus = sessionStorage.getItem('app_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      onAuthenticated()
    }
  }, [onAuthenticated])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('app_authenticated', 'true')
      setIsAuthenticated(true)
      onAuthenticated()
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="password-protection">
      <div className="password-form-container">
        <div className="password-form-header">
          <h2>🔒 Protected Access</h2>
          <p>Please enter the password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="password-form">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            placeholder="Enter password"
            className="password-input"
            autoFocus
          />
          {error && <div className="password-error">{error}</div>}
          <button type="submit" className="password-submit-btn">
            Access App
          </button>
        </form>
      </div>
    </div>
  )
}

export default PasswordProtection

