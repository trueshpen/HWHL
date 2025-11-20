import { useState, useEffect, useRef } from 'react'
import './PasswordProtection.css'

const CORRECT_PASSWORD = '190789'
const CODE_LENGTH = 6
const KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['fingerprint', '0', 'backspace']
]

function PasswordProtection({ onAuthenticated }) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isShaking, setIsShaking] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const inputRefs = useRef([])

  // Check if already authenticated in this session
  useEffect(() => {
    const authStatus = sessionStorage.getItem('app_authenticated')
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

  if (isAuthenticated) {
    return null
  }

  return (
    <div className={`password-protection ${isMobileView ? 'mobile-view' : ''}`}>
      <div className={`password-form-container ${isShaking ? 'shake' : ''} ${isMobileView ? 'mobile' : ''}`}>
        <div className="password-form-header">
          <h2>🔒 Protected Access</h2>
          <p>Enter 6-digit code</p>
        </div>
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
                    >
                      {value === 'fingerprint' ? '🌀' : value === 'backspace' ? '⌫' : value}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <button type="button" className="passcode-help">
              Forgot your passcode?
            </button>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PasswordProtection

