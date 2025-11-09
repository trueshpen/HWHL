import { useState } from 'react'
import CalendarView from './components/CalendarView'
import NotesView from './components/NotesView'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('calendar')

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
        </nav>
      </header>

      <main className="app-main">
        {currentView === 'calendar' ? <CalendarView /> : <NotesView />}
      </main>
    </div>
  )
}

export default App

