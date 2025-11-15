import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { updateData } from '../utils/storage'
import {
  reminderTypes,
  getStatus,
  getStatusBadgeColor,
  getLastEventDate,
  getDaysSince,
  getPreviousEventDate
} from '../utils/reminderUtils'
import './Reminders.css'

// Motivational phrases for "Show love" when done today
const motivationalPhrases = [
  'You can do it again!',
  'Keep the love flowing! 💕',
  'Another day, another chance to show love!',
  'Love never stops! Keep going!',
  'Every moment is a chance to make her happy!',
  'The more love, the better! 💖',
  'Keep spreading the love!',
  'Love is a daily practice!',
  'Make her smile again today! 😊',
  'Your love makes a difference every day!'
]

function Reminders({ data, onUpdate, onExpandChange }) {
  const [editing, setEditing] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteType, setNewNoteType] = useState('like')
  const [currentMotivationalPhrase, setCurrentMotivationalPhrase] = useState(motivationalPhrases[0])
  const [isExpanded, setIsExpanded] = useState(false)
  
  const handleExpandChange = (expanded) => {
    setIsExpanded(expanded)
    if (onExpandChange) {
      onExpandChange(expanded)
    }
  }

  const handleToggle = (type) => {
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...data.reminders[type],
          enabled: !data.reminders[type].enabled,
        }
      }
    })
    onUpdate(newData)
  }

  const handleMarkDone = (type) => {
    const now = new Date()
    const eventDate = now.toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Get existing events or initialize empty array
    const existingEvents = data.reminders[type].events || []
    
    // For "Show love" (general), allow multiple entries per day
    // For other types, don't add if already exists for today
    if (type !== 'general' && existingEvents.includes(eventDate)) {
      return
    }
    
    // For "Show love", pick a random motivational phrase
    if (type === 'general') {
      const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]
      setCurrentMotivationalPhrase(randomPhrase)
    }
    
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...data.reminders[type],
          lastDone: now.toISOString(),
          events: [...existingEvents, eventDate].sort().reverse() // Sort descending (newest first)
        }
      }
    })
    onUpdate(newData)
  }

  const handleClearDone = (type) => {
    const reminder = data.reminders[type]
    const events = reminder.events || []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = format(today, 'yyyy-MM-dd')
    
    // Remove today's entry if it exists
    if (events.includes(todayStr)) {
      const newEvents = events.filter(eventDate => eventDate !== todayStr)
      const previousEventDate = newEvents.length > 0 ? newEvents[0] : null
      
      const newData = updateData({
        reminders: {
          ...data.reminders,
          [type]: {
            ...data.reminders[type],
            lastDone: previousEventDate ? new Date(previousEventDate + 'T00:00:00').toISOString() : null,
            events: newEvents
          }
        }
      })
      onUpdate(newData)
    }
  }

  const handleEdit = (type) => {
    setEditing(type)
  }

  const handleSaveFrequency = (type, frequency) => {
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...data.reminders[type],
          frequency: parseInt(frequency),
        }
      }
    })
    onUpdate(newData)
    setEditing(null)
  }

  const handleAddNote = (type) => {
    if (!newNoteText.trim()) return
    
    const reminder = data.reminders[type]
    const existingNotes = reminder?.notes || []
    const newNote = {
      type: type === 'general' ? 'love' : (type === 'dateNights' ? 'note' : newNoteType),
      text: newNoteText.trim(),
      id: `note-${Date.now()}-${Math.random()}`
    }
    
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...reminder,
          notes: [...existingNotes, newNote]
        }
      }
    })
    onUpdate(newData)
    setNewNoteText('')
    setNewNoteType(type === 'general' ? 'love' : 'like')
  }

  const handleRemoveNote = (type, noteId) => {
    const reminder = data.reminders[type]
    const existingNotes = reminder?.notes || []
    
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...reminder,
          notes: existingNotes.filter(note => note.id !== noteId)
        }
      }
    })
    onUpdate(newData)
  }

  const handleUpdateNoteText = (type, noteId, newText) => {
    const reminder = data.reminders[type]
    const existingNotes = reminder?.notes || []
    
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...reminder,
          notes: existingNotes.map(note => 
            note.id === noteId ? { ...note, text: newText } : note
          )
        }
      }
    })
    onUpdate(newData)
  }

  return (
    <div className={`reminders card ${isExpanded ? 'expanded' : ''}`}>
      <div 
        className="card-header expandable-header-clickable"
        onClick={() => handleExpandChange(!isExpanded)}
      >
        <div className="header-content">
          <h3>💭 Reminders</h3>
          <span className="expand-icon-down">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="reminders-list">
        {Object.entries(reminderTypes).map(([type, info]) => {
          const reminder = data.reminders[type]
          if (!reminder) return null
          const status = getStatus(reminder, type)
          const daysSince = getDaysSince(reminder)

          return (
            <div key={type} className={`reminder-item ${status.status}`}>
              <div className="reminder-header">
                <div className="reminder-title">
                  <span className="reminder-emoji">{info.emoji}</span>
                  <span className="reminder-label">{info.label}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={reminder.enabled}
                    onChange={() => handleToggle(type)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {reminder.enabled && (
                <>
                  <div className="reminder-status">
                    {type !== 'general' && (
                      <>
                        {status.message && (
                          <span 
                            className={`status-badge ${status.status}`}
                            style={{ backgroundColor: getStatusBadgeColor(reminder) }}
                          >
                            {status.message}
                          </span>
                        )}
                        {getLastEventDate(reminder) && (() => {
                          const lastEventDate = getLastEventDate(reminder)
                          const lastEvent = new Date(lastEventDate.includes('T') ? lastEventDate : lastEventDate + 'T00:00:00')
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          lastEvent.setHours(0, 0, 0, 0)
                          const isToday = isSameDay(lastEvent, today)
                          return (
                            <span className="reminder-last-date">
                              {isToday ? 'Today' : `Last: ${format(lastEvent, 'd MMM')}`}
                            </span>
                          )
                        })()}
                      </>
                    )}
                  </div>

                  <div className="reminder-controls">
                    {editing === type && type !== 'general' ? (
                      <div className="frequency-edit">
                        <label>Frequency (days):</label>
                        <input
                          type="number"
                          min="1"
                          value={reminder.frequency}
                          onChange={(e) => handleSaveFrequency(type, e.target.value)}
                          onBlur={() => setEditing(null)}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <div className="reminder-info">
                          <span>{type === 'general' ? 'Every day' : `Every ${reminder.frequency} days`}</span>
                          {getLastEventDate(reminder) && (() => {
                            const lastEventDate = getLastEventDate(reminder)
                            const lastEvent = new Date(lastEventDate.includes('T') ? lastEventDate : lastEventDate + 'T00:00:00')
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            lastEvent.setHours(0, 0, 0, 0)
                            const isToday = isSameDay(lastEvent, today)
                            const isDueToday = status.isDueToday
                            
                            return (
                              <div className="last-done-container">
                                {type === 'general' ? (
                                  <div className="last-done-action">
                                    {isToday ? currentMotivationalPhrase : ''}
                                  </div>
                                ) : (
                                  <div className="last-done-action">
                                    {isToday ? 'Good job!' : (isDueToday ? 'Do something now!' : '')}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                        <div className="reminder-actions">
                          {type === 'general' ? (
                            <button
                              className="btn-edit"
                              onClick={() => setEditingNotes(editingNotes === type ? null : type)}
                            >
                              {editingNotes === type ? 'Done' : 'Edit'}
                            </button>
                          ) : (
                            <button
                              className="btn-edit"
                              onClick={() => handleEdit(type)}
                            >
                              Edit
                            </button>
                          )}
                          {type === 'general' ? (() => {
                            const lastEventDate = getLastEventDate(reminder)
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const isDoneToday = lastEventDate && (() => {
                              const lastEvent = new Date(lastEventDate.includes('T') ? lastEventDate : lastEventDate + 'T00:00:00')
                              lastEvent.setHours(0, 0, 0, 0)
                              return isSameDay(lastEvent, today)
                            })()
                            
                            return (
                              <button
                                className="btn-done"
                                onClick={() => handleMarkDone(type)}
                              >
                                {isDoneToday ? 'Do it again!' : 'Mark Done'}
                              </button>
                            )
                          })() : (() => {
                            const lastEventDate = getLastEventDate(reminder)
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            const todayStr = format(today, 'yyyy-MM-dd')
                            const hasTodayEvent = reminder.events && reminder.events.includes(todayStr)
                            
                            return hasTodayEvent ? (
                              <button
                                className="btn-clear"
                                onClick={() => handleClearDone(type)}
                                title="Remove today's entry"
                              >
                                Clear
                              </button>
                            ) : (
                              <button
                                className="btn-done"
                                onClick={() => handleMarkDone(type)}
                              >
                                Mark Done
                              </button>
                            )
                          })()}
                        </div>
                      </>
                    )}
                  </div>

                  {type === 'general' && (
                    <div className="reminder-notes">
                      <div className="notes-list">
                        {(reminder.notes || []).map(note => (
                          <div key={note.id} className={`note-item ${note.type}`}>
                            {editingNotes === type ? (
                              <>
                                <textarea
                                  value={note.text}
                                  onChange={(e) => handleUpdateNoteText(type, note.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setEditingNotes(null)
                                    } else if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
                                      e.preventDefault()
                                      setEditingNotes(null)
                                    }
                                  }}
                                  className="note-input"
                                  rows={3}
                                />
                                <button
                                  onClick={() => handleRemoveNote(type, note.id)}
                                  className="remove-note-btn"
                                >
                                  ×
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="note-icon">💕</span>
                                <span className="note-text">{note.text}</span>
                              </>
                            )}
                          </div>
                        ))}
                        
                        {editingNotes === type && (
                          <div className="add-note-form">
                            <textarea
                              value={newNoteText}
                              onChange={(e) => setNewNoteText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleAddNote(type)
                                } else if (e.key === 'Escape') {
                                  setEditingNotes(null)
                                  setNewNoteText('')
                                }
                              }}
                              placeholder="Add love note..."
                              className="note-input"
                              rows={3}
                            />
                            <button
                              onClick={() => handleAddNote(type)}
                              className="add-note-btn"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {type === 'flowers' && (
                    <div className="reminder-notes">
                      <div className="notes-header">
                        <h4>Notes</h4>
                        <button 
                          onClick={() => setEditingNotes(editingNotes === type ? null : type)}
                          className="edit-notes-btn"
                        >
                          {editingNotes === type ? 'Done' : 'Edit'}
                        </button>
                      </div>
                      <div className="notes-list">
                        {(reminder.notes || []).map(note => (
                          <div key={note.id} className={`note-item ${note.type}`}>
                            {editingNotes === type ? (
                              <>
                                <textarea
                                  value={note.text}
                                  onChange={(e) => handleUpdateNoteText(type, note.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setEditingNotes(null)
                                    } else if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
                                      e.preventDefault()
                                      setEditingNotes(null)
                                    }
                                  }}
                                  className="note-input"
                                  rows={3}
                                />
                                <button
                                  onClick={() => handleRemoveNote(type, note.id)}
                                  className="remove-note-btn"
                                >
                                  ×
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="note-icon">
                                  {note.type === 'like' ? '✓' : '×'}
                                </span>
                                <span className="note-text">{note.text}</span>
                              </>
                            )}
                          </div>
                        ))}
                        
                        {editingNotes === type && (
                          <div className="add-note-form">
                            <select
                              value={newNoteType}
                              onChange={(e) => setNewNoteType(e.target.value)}
                              className="note-type-select"
                            >
                              <option value="like">✓ Likes</option>
                              <option value="dislike">× Dislikes</option>
                            </select>
                            <input
                              type="text"
                              value={newNoteText}
                              onChange={(e) => setNewNoteText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddNote(type)}
                              placeholder="Add note..."
                              className="note-input"
                            />
                            <button
                              onClick={() => handleAddNote(type)}
                              className="add-note-btn"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {type === 'dateNights' && (
                    <div className="reminder-notes">
                      <div className="notes-header">
                        <h4>Notes</h4>
                        <button 
                          onClick={() => setEditingNotes(editingNotes === type ? null : type)}
                          className="edit-notes-btn"
                        >
                          {editingNotes === type ? 'Done' : 'Edit'}
                        </button>
                      </div>
                      <div className="notes-list">
                        {(reminder.notes || []).map(note => (
                          <div key={note.id} className={`note-item ${note.type}`}>
                            {editingNotes === type ? (
                              <>
                                <textarea
                                  value={note.text}
                                  onChange={(e) => handleUpdateNoteText(type, note.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setEditingNotes(null)
                                    } else if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
                                      e.preventDefault()
                                      setEditingNotes(null)
                                    }
                                  }}
                                  className="note-input"
                                  rows={3}
                                />
                                <button
                                  onClick={() => handleRemoveNote(type, note.id)}
                                  className="remove-note-btn"
                                >
                                  ×
                                </button>
                              </>
                            ) : (
                              <span className="note-text">{note.text}</span>
                            )}
                          </div>
                        ))}
                        
                        {editingNotes === type && (
                          <div className="add-note-form">
                            <input
                              type="text"
                              value={newNoteText}
                              onChange={(e) => setNewNoteText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddNote(type)}
                              placeholder="Add note..."
                              className="note-input"
                            />
                            <button
                              onClick={() => handleAddNote(type)}
                              className="add-note-btn"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}

export default Reminders
