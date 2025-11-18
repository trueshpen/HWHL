import { useState, useEffect, useRef } from 'react'
import CalendarView from './components/CalendarView'
import NotesView from './components/NotesView'
import PasswordProtection from './components/PasswordProtection'
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
  const fileInputRef = useRef(null)

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

  const handleTestNotification = async () => {
    const ok = await showTestNotification()
    if (ok) {
      setNotificationStatus({ type: 'success', message: 'Notifications enabled on this device.' })
    } else {
      setNotificationStatus({ type: 'error', message: 'Notifications are blocked for this browser.' })
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('app_authenticated')
    setIsAuthenticated(false)
    setAuthKey(prev => prev + 1) // Force PasswordProtection to remount
  }

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
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <PasswordProtection 
        key={authKey}
        onAuthenticated={() => setIsAuthenticated(true)} 
      />
      {isAuthenticated && (
        <div className="app">
          <header className="app-header">
            <h1>💕 Wife Happiness App</h1>
            <nav className="view-switcher">
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
            <div className="header-actions">
              <div className="backup-buttons">
                <button
                  className="backup-btn"
                  onClick={handleExportData}
                  title="Download your data as backup file"
                >
                  Export data
                </button>
                <button
                  className="backup-btn file-access-btn"
                  onClick={handleImportClick}
                  title="Import data from backup file"
                >
                  Import data
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden-file-input"
                  onChange={handleImportData}
                />
              </div>
              <button
                className="allow-notifications-btn"
                onClick={handleTestNotification}
                title="Allow notifications"
              >
                Allow notifications
              </button>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Log out"
              >
                Log Out
              </button>
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
            {currentView === 'calendar' ? <CalendarView /> : <NotesView />}
          </main>
        </div>
      )}
    </>
  )
}

export default App

