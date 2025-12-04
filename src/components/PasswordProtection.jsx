import { useState, useEffect, useRef } from 'react'
import './PasswordProtection.css'

const CODE_LENGTH = 6
const PASSCODE_REGEX = /^\d{6}$/
const KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['fingerprint', '0', 'backspace']
]

function PasswordProtection({ security, onAuthenticated, onSecurityUpdate }) {
  const storedPassword = security?.password || null
  const hasSecretQuestion = Boolean(
    security?.secretQuestion?.trim() && security?.secretAnswer?.trim()
  )
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isShaking, setIsShaking] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [isResetVisible, setIsResetVisible] = useState(false)
  const [resetAnswer, setResetAnswer] = useState('')
  const [resetNewCode, setResetNewCode] = useState('')
  const [resetConfirmCode, setResetConfirmCode] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')
  const inputRefs = useRef([])

  // Check if already authenticated in this session
  useEffect(() => {
    const authStatus = sessionStorage.getItem('app_authenticated')
    const deadline = parseInt(sessionStorage.getItem('auto_logout_deadline') || '0', 10)
    if (deadline && Date.now() >= deadline) {
      sessionStorage.removeItem('app_authenticated')
      sessionStorage.removeItem('auto_logout_deadline')
      return
    }
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      onAuthenticated()
    }
  }, [onAuthenticated])

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobileView(window.matchMedia('(max-width: 768px)').matches)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-verify when all digits are entered
  useEffect(() => {
    if (!storedPassword) return
    const fullCode = code.join('')
    if (fullCode.length === CODE_LENGTH) {
      if (fullCode === storedPassword) {
        sessionStorage.setItem('app_authenticated', 'true')
        sessionStorage.removeItem('auto_logout_deadline')
        setIsAuthenticated(true)
        onAuthenticated()
      } else {
        setIsShaking(true)
        setTimeout(() => {
          setIsShaking(false)
          setCode(Array(CODE_LENGTH).fill(''))
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
          }
        }, 500)
      }
    }
  }, [code, onAuthenticated, storedPassword])

  // Auto authenticate if no passcode is set
  useEffect(() => {
    if (storedPassword || isAuthenticated) return
    sessionStorage.setItem('app_authenticated', 'true')
    sessionStorage.removeItem('auto_logout_deadline')
    setIsAuthenticated(true)
    onAuthenticated()
  }, [storedPassword, isAuthenticated, onAuthenticated])

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

  const fillNextDigit = (digit) => {
    if (!/^\d$/.test(digit)) return
    const nextIndex = code.findIndex((val) => val === '')
    if (nextIndex === -1) return
    const newCode = [...code]
    newCode[nextIndex] = digit
    setCode(newCode)
  }

  const removeLastDigit = () => {
    const lastFilledIndex = [...code].reverse().findIndex(val => val !== '')
    if (lastFilledIndex === -1) return
    const actualIndex = CODE_LENGTH - 1 - lastFilledIndex
    const newCode = [...code]
    newCode[actualIndex] = ''
    setCode(newCode)
  }

  const handleKeypadPress = (value) => {
    if (value === 'backspace') {
      removeLastDigit()
      return
    }
    if (value === 'fingerprint') {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      return
    }
    fillNextDigit(value)
  }

  const handleResetToggle = () => {
    setIsResetVisible(!isResetVisible)
    setResetAnswer('')
    setResetNewCode('')
    setResetConfirmCode('')
    setResetError('')
    setResetMessage('')
  }

  const handleResetSubmit = (event) => {
    event.preventDefault()
    if (!hasSecretQuestion) {
      setResetError('No secret question found. Log in and set one in settings.')
      return
    }
    const storedAnswer = (security?.secretAnswer || '').trim().toLowerCase()
    if (!resetAnswer.trim()) {
      setResetError('Answer is required.')
      return
    }
    if (storedAnswer !== resetAnswer.trim().toLowerCase()) {
      setResetError('Answer does not match.')
      return
    }
    if (!PASSCODE_REGEX.test(resetNewCode)) {
      setResetError('Passcode must be exactly 6 digits.')
      return
    }
    if (resetNewCode !== resetConfirmCode) {
      setResetError('Confirmation does not match.')
      return
    }
    if (onSecurityUpdate) {
      onSecurityUpdate({ password: resetNewCode })
    }
    setResetMessage('Passcode reset. Signing you in…')
    setResetError('')
    sessionStorage.setItem('app_authenticated', 'true')
    sessionStorage.removeItem('auto_logout_deadline')
    setIsAuthenticated(true)
    onAuthenticated()
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className={`password-protection ${isMobileView ? 'mobile-view' : ''}`}>
      <div className={`password-form-container ${isShaking ? 'shake' : ''} ${isMobileView ? 'mobile' : ''}`}>
        <div className="password-form-header">
          <h2>🔒 Protected Access</h2>
          {storedPassword ? (
            isResetVisible ? (
              <p>Answer your secret question to set a new code.</p>
            ) : (
              <p>Enter the 6-digit code</p>
            )
          ) : (
            <p>Passcode disabled. Open settings to re-enable.</p>
          )}
        </div>
        {storedPassword && isResetVisible ? (
          <div className="password-reset-wrapper">
            <button type="button" className="reset-back-btn" onClick={handleResetToggle}>
              ← Back to passcode
            </button>
            <div className="password-reset-card">
              <h3>Reset passcode</h3>
              {hasSecretQuestion ? (
                <form className="reset-form" onSubmit={handleResetSubmit}>
                  <p className="reset-question">{security?.secretQuestion}</p>
                  <label>
                    Answer
                    <input
                      type="text"
                      value={resetAnswer}
                      onChange={(e) => setResetAnswer(e.target.value)}
                      placeholder="Type your answer"
                    />
                  </label>
                  <label>
                    New passcode
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={CODE_LENGTH}
                      value={resetNewCode}
                      onChange={(e) => setResetNewCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6 digits"
                    />
                  </label>
                  <label>
                    Confirm passcode
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={CODE_LENGTH}
                      value={resetConfirmCode}
                      onChange={(e) => setResetConfirmCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Re-enter 6 digits"
                    />
                  </label>
                  {(resetError || resetMessage) && (
                    <div className={`reset-feedback ${resetError ? 'error' : 'success'}`}>
                      {resetError || resetMessage}
                    </div>
                  )}
                  <div className="reset-actions">
                    <button type="submit" className="primary">
                      Reset passcode
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="reset-info">
                    No secret question saved. Log in with the current passcode and add one in the security
                    settings panel.
                  </p>
                  <div className="reset-actions">
                    <button type="button" className="link" onClick={handleResetToggle}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {isMobileView ? (
              <>
                <div className="passcode-dots">
                  {code.map((digit, index) => (
                    <span
                      key={index}
                      className={`passcode-dot ${digit ? 'filled' : ''}`}
                    ></span>
                  ))}
                </div>
                <div className="passcode-keypad">
                  {KEYPAD_LAYOUT.map((row, rowIndex) => (
                    <div key={rowIndex} className="keypad-row">
                      {row.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`keypad-btn ${value === 'fingerprint' || value === 'backspace' ? 'secondary' : ''}`}
                          onClick={() => handleKeypadPress(value)}
                          disabled={!storedPassword}
                        >
                          {value === 'fingerprint' ? '🌀' : value === 'backspace' ? '⌫' : value}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                {storedPassword && (
                  <button type="button" className="passcode-help" onClick={handleResetToggle}>
                    Forgot your passcode?
                  </button>
                )}
              </>
            ) : (
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
                    disabled={!storedPassword}
                  />
                ))}
              </div>
            )}
            {!isMobileView && storedPassword && (
              <button type="button" className="passcode-help desktop" onClick={handleResetToggle}>
                Forgot your passcode?
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PasswordProtection

