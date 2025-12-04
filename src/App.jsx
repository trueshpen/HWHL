import { useState, useEffect, useRef, useCallback } from 'react'
import CalendarView from './components/CalendarView'
import NotesView from './components/NotesView'
import PersonalizationView from './components/PersonalizationView'
import PasswordProtection from './components/PasswordProtection'
import SecuritySettings from './components/SecuritySettings'
import { loadDataSync, loadData, saveData } from './utils/storage'
import { scheduleDailyNotifications, showTestNotification } from './utils/notifications'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authKey, setAuthKey] = useState(0)
  const [currentView, setCurrentView] = useState('calendar')
  const [data, setData] = useState(loadDataSync())
  const [backupStatus, setBackupStatus] = useState(null)
  const [notificationStatus, setNotificationStatus] = useState(null)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [showSecuritySettings, setShowSecuritySettings] = useState(false)
  const fileInputRef = useRef(null)
  const settingsMenuRef = useRef(null)
  const autoLogoutTimerRef = useRef(null)
  const clearAutoLogoutTimer = useCallback((clearStorage = false) => {
    if (autoLogoutTimerRef.current) {
      clearTimeout(autoLogoutTimerRef.current)
      autoLogoutTimerRef.current = null
    }
    if (clearStorage) {
      sessionStorage.removeItem('auto_logout_deadline')
    }
  }, [])

  // Load data from server on mount
  useEffect(() => {
    const syncData = async () => {
      const serverData = await loadData()
      setData(serverData)
    }
    syncData()
  }, [])

  // Initialize notifications
  useEffect(() => {
    const cleanup = scheduleDailyNotifications(data, () => {
      // Get fresh data for notifications
      return loadDataSync()
    })

    return cleanup
  }, [data])

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false)
      }
    }

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettingsMenu])

  const handleSecurityUpdate = useCallback((updates) => {
    setData(prevData => {
      const nextSecurity = {
        ...(prevData.security || {}),
        ...updates
      }
      const newData = {
        ...prevData,
        security: nextSecurity
      }
      saveData(newData)
      return newData
    })
  }, [])

  const handleTestNotification = async () => {
    const ok = await showTestNotification()
    if (ok) {
      setNotificationStatus({ type: 'success', message: 'Notifications enabled on this device.' })
    } else {
      setNotificationStatus({ type: 'error', message: 'Notifications are blocked for this browser.' })
    }
    setShowSettingsMenu(false)
  }

  const handleLogout = useCallback(() => {
    clearAutoLogoutTimer(true)
    sessionStorage.removeItem('app_authenticated')
    setIsAuthenticated(false)
    setAuthKey(prev => prev + 1) // Force PasswordProtection to remount
    setShowSettingsMenu(false)
    setShowSecuritySettings(false)
  }, [clearAutoLogoutTimer])

  useEffect(() => {
    if (!backupStatus) return
    const timer = setTimeout(() => setBackupStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [backupStatus])

  useEffect(() => {
    if (!notificationStatus) return
    const timer = setTimeout(() => setNotificationStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [notificationStatus])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const updateViewport = (event) => setIsMobileViewport(event.matches)
    setIsMobileViewport(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const deadline = parseInt(sessionStorage.getItem('auto_logout_deadline') || '0', 10)
    if (deadline && Date.now() >= deadline) {
      handleLogout()
    }
  }, [isAuthenticated, handleLogout])

  useEffect(() => {
    if (!isAuthenticated) {
      clearAutoLogoutTimer(true)
      return
    }
    if (typeof document === 'undefined') return

    const startCountdown = () => {
      if (!isMobileViewport) return
      const deadline = Date.now() + 60000
      sessionStorage.setItem('auto_logout_deadline', String(deadline))
      clearAutoLogoutTimer()
      autoLogoutTimerRef.current = setTimeout(() => {
        handleLogout()
      }, 60000)
    }

    const handleVisibilityChange = () => {
      if (!isMobileViewport) return
      if (document.visibilityState === 'hidden') {
        startCountdown()
      } else if (document.visibilityState === 'visible') {
        const deadline = parseInt(sessionStorage.getItem('auto_logout_deadline') || '0', 10)
        if (deadline && Date.now() >= deadline) {
          clearAutoLogoutTimer(true)
          handleLogout()
        } else {
          clearAutoLogoutTimer(true)
        }
      }
    }

    const handlePageHide = () => {
      if (!isMobileViewport) return
      startCountdown()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      clearAutoLogoutTimer(true)
    }
  }, [isAuthenticated, isMobileViewport, handleLogout, clearAutoLogoutTimer])

  const handleExportData = () => {
    try {
      const dataToExport = loadDataSync()
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().split('T')[0]
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `hwhl-backup-${timestamp}.json`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      setBackupStatus({ type: 'success', message: 'Data exported successfully.' })
    } catch (error) {
      console.error('Export error:', error)
      setBackupStatus({ type: 'error', message: 'Failed to export data.' })
    }
    setShowSettingsMenu(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportData = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const importedData = JSON.parse(text)
        saveData(importedData)
        setData(importedData)
        setBackupStatus({ type: 'success', message: 'Data imported successfully.' })
      } catch (error) {
        console.error('Import error:', error)
        setBackupStatus({ type: 'error', message: 'Invalid backup file.' })
      } finally {
        event.target.value = ''
        setShowSettingsMenu(false)
      }
    }
    reader.readAsText(file)
  }

  const onUpdateData = (newData) => {
    setData(newData)
  }

  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarView data={data} onUpdate={onUpdateData} />
      case 'personalization':
        return <PersonalizationView data={data} onUpdate={onUpdateData} />
      case 'notes':
        return <NotesView data={data} onUpdate={onUpdateData} />
      default:
        return <CalendarView data={data} onUpdate={onUpdateData} />
    }
  }

  return (
    <>
      <PasswordProtection 
        key={authKey}
        security={data.security}
        onSecurityUpdate={handleSecurityUpdate}
        onAuthenticated={() => setIsAuthenticated(true)} 
      />
      {isAuthenticated && (
        <div className="app">
          <header className="app-header">
            <h1>💕 Wife Happiness App</h1>
            
            {/* Desktop Navigation */}
            <nav className="view-switcher desktop-only">
              <button
                className={currentView === 'calendar' ? 'active' : ''}
                onClick={() => setCurrentView('calendar')}
              >
                📅 Calendar
              </button>
              <button
                className={currentView === 'notes' ? 'active' : ''}
                onClick={() => setCurrentView('notes')}
              >
                📝 Notes
              </button>
            </nav>

            {/* Settings Icon (Desktop & Mobile) */}
            <div className="settings-container" ref={settingsMenuRef}>
              <button 
                className="settings-icon-btn"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                title="Settings"
              >
                ⚙️
              </button>
              
              {showSettingsMenu && (
                <div className="settings-dropdown">
                  <button onClick={() => {
                    setShowSecuritySettings(true)
                    setShowSettingsMenu(false)
                  }}>
                    🔐 Security settings
                  </button>
                  <button onClick={handleExportData}>
                    📥 Export data
                  </button>
                  <button onClick={handleImportClick}>
                    📤 Import data
                  </button>
                  <button onClick={handleTestNotification}>
                    🔔 Allow notifications
                  </button>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="logout-option">
                    🚪 Log Out
                  </button>
                </div>
              )}
              {/* Re-use the file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden-file-input"
                onChange={handleImportData}
              />
            </div>

            {(backupStatus || notificationStatus) && (
              <div className="status-stack">
                {backupStatus && (
                  <div className={`status-pill ${backupStatus.type}`}>
                    {backupStatus.message}
                  </div>
                )}
                {notificationStatus && (
                  <div className={`status-pill ${notificationStatus.type}`}>
                    {notificationStatus.message}
                  </div>
                )}
              </div>
            )}
          </header>

          <main className="app-main">
            {renderContent()}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="bottom-nav mobile-only">
            <button
              className={`nav-item ${currentView === 'calendar' ? 'active' : ''}`}
              onClick={() => setCurrentView('calendar')}
            >
              <span className="nav-icon">📅</span>
              <span className="nav-label">Calendar</span>
            </button>
            <button
              className={`nav-item ${currentView === 'personalization' ? 'active' : ''}`}
              onClick={() => setCurrentView('personalization')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Personalization</span>
            </button>
            <button
              className={`nav-item ${currentView === 'notes' ? 'active' : ''}`}
              onClick={() => setCurrentView('notes')}
            >
              <span className="nav-icon">📝</span>
              <span className="nav-label">Notes</span>
            </button>
          </nav>
        </div>
      )}
      {isAuthenticated && showSecuritySettings && (
        <SecuritySettings
          security={data.security}
          onUpdate={handleSecurityUpdate}
          onClose={() => setShowSecuritySettings(false)}
        />
      )}
    </>
  )
}

export default App
