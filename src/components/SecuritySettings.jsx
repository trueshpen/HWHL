import { useEffect, useState } from 'react'
import './SecuritySettings.css'

const PASSCODE_LENGTH = 6
const PASSCODE_REGEX = new RegExp(`^\\d{${PASSCODE_LENGTH}}$`)

function SecuritySettings({ security, onUpdate, onClose }) {
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [question, setQuestion] = useState(security?.secretQuestion || '')
  const [answer, setAnswer] = useState(security?.secretAnswer || '')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setQuestion(security?.secretQuestion || '')
    setAnswer(security?.secretAnswer || '')
  }, [security])

  const showStatus = (message) => {
    setStatusMessage(message)
    setErrorMessage('')
  }

  const showError = (message) => {
    setErrorMessage(message)
    setStatusMessage('')
  }

  const handleSavePasscode = (event) => {
    event.preventDefault()
    if (!PASSCODE_REGEX.test(newPasscode)) {
      showError(`Passcode must be exactly ${PASSCODE_LENGTH} digits.`)
      return
    }
    if (newPasscode !== confirmPasscode) {
      showError('Passcode confirmation does not match.')
      return
    }

    onUpdate({
      password: newPasscode
    })
    setNewPasscode('')
    setConfirmPasscode('')
    showStatus('Passcode updated.')
  }

  const handleRemovePasscode = () => {
    onUpdate({
      password: null
    })
    setNewPasscode('')
    setConfirmPasscode('')
    showStatus('Passcode removed. App will open without a code.')
  }

  const handleSaveSecret = (event) => {
    event.preventDefault()
    if (!question.trim() || !answer.trim()) {
      showError('Both secret question and answer are required.')
      return
    }
    onUpdate({
      secretQuestion: question.trim(),
      secretAnswer: answer.trim()
    })
    showStatus('Secret question saved.')
  }

  return (
    <div className="security-settings-overlay">
      <div className="security-settings-panel card">
        <div className="security-settings-header">
          <div>
            <h2>🔐 Security settings</h2>
            <p>Manage the 6-digit passcode and reset question.</p>
          </div>
          <button className="security-close-btn" type="button" onClick={onClose}>
            ✖️
          </button>
        </div>

        <section className="security-section">
          <div className="security-section-header">
            <h3>Passcode</h3>
            <span className={`passcode-status ${security?.password ? 'active' : ''}`}>
              {security?.password ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="section-hint">
            Use a {PASSCODE_LENGTH}-digit code. You can change or remove it without entering the old code.
          </p>

          <form className="security-form" onSubmit={handleSavePasscode}>
            <label>
              New passcode
              <input
                type="password"
                inputMode="numeric"
                pattern="\d*"
                maxLength={PASSCODE_LENGTH}
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6 digits"
              />
            </label>
            <label>
              Confirm passcode
              <input
                type="password"
                inputMode="numeric"
                pattern="\d*"
                maxLength={PASSCODE_LENGTH}
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                placeholder="Re-enter 6 digits"
              />
            </label>
            <div className="security-actions">
              <button type="submit" className="primary">
                Save passcode
              </button>
              {security?.password && (
                <button type="button" className="link" onClick={handleRemovePasscode}>
                  Remove passcode
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="security-section">
          <div className="security-section-header">
            <h3>Secret question</h3>
          </div>
          <p className="section-hint">
            The question and answer are stored locally and used for the "Forgot passcode?" flow.
          </p>
          <form className="security-form" onSubmit={handleSaveSecret}>
            <label>
              Question
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Where did we first meet?"
              />
            </label>
            <label>
              Answer
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Stored exactly as you type it"
              />
            </label>
            <div className="security-actions">
              <button type="submit" className="primary">
                Save secret question
              </button>
            </div>
          </form>
        </section>

        {(statusMessage || errorMessage) && (
          <div className={`security-feedback ${errorMessage ? 'error' : 'success'}`}>
            {errorMessage || statusMessage}
          </div>
        )}
      </div>
    </div>
  )
}

export default SecuritySettings

