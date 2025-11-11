import { useState, useEffect } from 'react'
import CalendarView from './components/CalendarView'
import NotesView from './components/NotesView'
import { exportData, importData, clearAllData, requestFileAccess, initializeFileAccess } from './utils/storage'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('calendar')
  const [fileAccessEnabled, setFileAccessEnabled] = useState(false)
  const [fileAccessWasGranted, setFileAccessWasGranted] = useState(false)

  useEffect(() => {
    // Check if file access was previously granted
    initializeFileAccess().then((enabled) => {
      // File handles can't persist across page reloads
      // Show button so user can re-enable (browser will remember file location)
      setFileAccessWasGranted(enabled)
      setFileAccessEnabled(false)
    })
  }, [])

  const handleExport = () => {
    exportData()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (file) {
      importData(file)
        .then(() => {
          alert('Data imported successfully! Refreshing...')
          window.location.reload()
        })
        .catch((error) => {
          alert('Error importing data: ' + error.message)
        })
    }
    e.target.value = ''
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAllData()
      alert('All data cleared! Refreshing...')
      window.location.reload()
    }
  }

  const handleEnableFileAccess = async () => {
    const granted = await requestFileAccess()
    if (granted) {
      setFileAccessEnabled(true)
      alert('File access enabled! Your data will now be saved to a file on your PC automatically.')
    } else {
      alert('File access was not granted. Data will be saved to browser storage only.')
    }
  }

  return (
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
          <div className="backup-buttons">
            {!fileAccessEnabled && (
              <button 
                onClick={handleEnableFileAccess} 
                className="backup-btn file-access-btn" 
                title={fileAccessWasGranted 
                  ? "Re-enable file saving (browser will remember your file location)" 
                  : "Enable automatic file saving to PC (no downloads)"}
              >
                💾 {fileAccessWasGranted ? 'Re-enable File Save' : 'Enable File Save'}
              </button>
            )}
            {fileAccessEnabled && (
              <span className="file-access-status" title="Data is being saved to a file on your PC">
                ✓ File Save Active
              </span>
            )}
            <button onClick={handleExport} className="backup-btn" title="Export data to file">
              💾 Export
            </button>
            <label className="backup-btn" title="Import data from file">
              📂 Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <button onClick={handleClearData} className="backup-btn clear-btn" title="Clear all data">
              🗑️ Clear
            </button>
          </div>
        </nav>
      </header>

      <main className="app-main">
        {currentView === 'calendar' ? <CalendarView /> : <NotesView />}
      </main>
    </div>
  )
}

export default App

