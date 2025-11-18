import { useState, useEffect, useRef } from 'react'
import './PasswordProtection.css'

const CORRECT_PASSWORD = '190789'
const CODE_LENGTH = 6

function PasswordProtection({ onAuthenticated }) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isShaking, setIsShaking] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const inputRefs = useRef([])

  // Check if already authenticated in this session
  useEffect(() => {
    const authStatus = sessionStorage.getItem('app_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      onAuthenticated()
    }
  }, [onAuthenticated])

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    const fullCode = code.join('')
    if (fullCode.length === CODE_LENGTH) {
      if (fullCode === CORRECT_PASSWORD) {
        sessionStorage.setItem('app_authenticated', 'true')
        setIsAuthenticated(true)
        onAuthenticated()
      } else {
        // Shake animation
        setIsShaking(true)
        setTimeout(() => {
          setIsShaking(false)
          setCode(['', '', '', '', '', ''])
          // Focus first input after shake
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
          }
        }, 500)
      }
    }
  }, [code, onAuthenticated])

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input if value entered
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH)
        const newCode = [...code]
        digits.split('').forEach((digit, i) => {
          if (index + i < CODE_LENGTH) {
            newCode[index + i] = digit
          }
        })
        setCode(newCode)
        // Focus last filled input or next empty
        const lastFilledIndex = Math.min(index + digits.length - 1, CODE_LENGTH - 1)
        inputRefs.current[lastFilledIndex]?.focus()
      })
    }
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="password-protection">
      <div className={`password-form-container ${isShaking ? 'shake' : ''}`}>
        <div className="password-form-header">
          <h2>🔒 Protected Access</h2>
          <p>Enter 6-digit code</p>
        </div>
        <div className="password-code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="password-code-input"
              autoFocus={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PasswordProtection

