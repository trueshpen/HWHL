import { useState, useEffect } from 'react'
import CalendarView from './components/CalendarView'
import NotesView from './components/NotesView'
import PasswordProtection from './components/PasswordProtection'
import { loadDataSync, loadData } from './utils/storage'
import { scheduleDailyNotifications, showTestNotification } from './utils/notifications'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authKey, setAuthKey] = useState(0)
  const [currentView, setCurrentView] = useState('calendar')
  const [data, setData] = useState(loadDataSync())

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
    await showTestNotification()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('app_authenticated')
    setIsAuthenticated(false)
    setAuthKey(prev => prev + 1) // Force PasswordProtection to remount
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

