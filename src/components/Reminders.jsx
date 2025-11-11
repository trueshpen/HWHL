import { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { updateData } from '../utils/storage'
import './Reminders.css'

const reminderTypes = {
  flowers: { emoji: '🌸', label: 'Flowers', defaultFrequency: 7 },
  surprises: { emoji: '🎁', label: 'Small Surprises', defaultFrequency: 2 },
  dateNights: { emoji: '💑', label: 'Date Nights', defaultFrequency: 7 },
  general: { emoji: '💕', label: 'Show love', defaultFrequency: 1 },
}

function Reminders({ data, onUpdate }) {
  const [editing, setEditing] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteType, setNewNoteType] = useState('like')

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
    
    // Remove the most recent event (first in array since sorted newest first)
    const newEvents = events.length > 0 ? events.slice(1) : []
    
    // Get the previous event date if available
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

  const getLastEventDate = (reminder) => {
    if (!reminder) return null
    // Get the most recent event date from events array
    if (reminder.events && reminder.events.length > 0) {
      // Events are sorted newest first
      return reminder.events[0]
    }
    // Fall back to lastDone if no events
    return reminder.lastDone
  }

  const getDaysSince = (reminder) => {
    if (!reminder) return null
    const lastEvent = getLastEventDate(reminder)
    if (!lastEvent) return null
    const lastEventDate = typeof lastEvent === 'string' 
      ? (lastEvent.includes('T') ? new Date(lastEvent) : new Date(lastEvent + 'T00:00:00'))
      : new Date(lastEvent)
    return differenceInDays(new Date(), lastEventDate)
  }

  const getDaysUntilNext = (reminder, frequency) => {
    const daysSince = getDaysSince(reminder)
    if (daysSince === null) return null
    return frequency - daysSince
  }

  const getStatusBadgeColor = (reminder) => {
    if (!reminder) return '#ccc' // gray - no reminder
    if (!reminder.enabled) return '#ccc' // gray - disabled
    const lastEvent = getLastEventDate(reminder)
    if (!lastEvent) return '#ccc' // gray - never done
    
    const daysUntil = getDaysUntilNext(reminder, reminder.frequency)
    if (daysUntil === null) return '#ccc'
    
    if (daysUntil > 1) return 'var(--success)' // green - more than 1 day before
    if (daysUntil >= -1) return 'var(--warning)' // yellow - 1 before, event day, 1 after
    if (daysUntil >= -7) return '#ff4757' // red - 1+ days after
    return '#c44569' // dark red - 7+ days after
  }

  const getStatus = (reminder, type) => {
    if (!reminder) return { status: 'pending', message: 'Never done' }
    if (!reminder.enabled) return { status: 'disabled', message: 'Disabled' }
    const lastEvent = getLastEventDate(reminder)
    if (!lastEvent) return { status: 'pending', message: 'Never done' }
    
    const daysSince = getDaysSince(reminder)
    if (daysSince === null) return { status: 'pending', message: 'Never done' }
    if (daysSince >= reminder.frequency) {
      return { status: 'due', message: `Due (${daysSince} days ago)` }
    }
    // For 'general' type, don't show "X days until due" message
    if (type === 'general') {
      return { status: 'ok', message: '' }
    }
    return { status: 'ok', message: `${reminder.frequency - daysSince} days until due` }
  }

  const getPreviousEventDate = (reminder) => {
    if (!reminder) return null
    if (!reminder.events || reminder.events.length === 0) return null
    // Events are sorted newest first, so get the second one (index 1) if it exists
    if (reminder.events.length > 1) {
      return reminder.events[1]
    }
    return null
  }

  const handleAddNote = (type) => {
    if (!newNoteText.trim()) return
    
    const reminder = data.reminders[type]
    const existingNotes = reminder?.notes || []
    const newNote = {
      type: type === 'general' ? 'love' : newNoteType,
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
    <div className="reminders card">
      <div className="card-header">
        <h3>💭 Reminders</h3>
      </div>

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
                        <span 
                          className={`status-badge ${status.status}`}
                          style={{ backgroundColor: getStatusBadgeColor(reminder) }}
                        >
                          {status.message}
                        </span>
                        {getLastEventDate(reminder) && (
                          <span className="reminder-counter">
                            {getDaysSince(reminder) || 0}d
                          </span>
                        )}
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
                            const isToday = format(lastEvent, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                            
                            return (
                              <div className="last-done-container">
                                <div className="last-done">
                                  {isToday ? 'Today' : `Last: ${format(lastEvent, 'd MMM')}`}
                                </div>
                                <div className="last-done-action">
                                  {isToday ? 'You can do it again!' : 'Do something now!'}
                                </div>
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
                              return format(lastEvent, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                            })()
                            
                            return (
                              <button
                                className="btn-done"
                                onClick={() => handleMarkDone(type)}
                              >
                                {isDoneToday ? 'Do it again!' : 'Mark Done'}
                              </button>
                            )
                          })() : (
                            reminder.lastDone ? (
                              <button
                                className="btn-clear"
                                onClick={() => handleClearDone(type)}
                                title="Clear the 'done' status"
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
                          )}
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
                                <input
                                  type="text"
                                  value={note.text}
                                  onChange={(e) => handleUpdateNoteText(type, note.id, e.target.value)}
                                  className="note-input"
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
                            <input
                              type="text"
                              value={newNoteText}
                              onChange={(e) => setNewNoteText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddNote(type)}
                              placeholder="Add love note..."
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
                                <input
                                  type="text"
                                  value={note.text}
                                  onChange={(e) => handleUpdateNoteText(type, note.id, e.target.value)}
                                  className="note-input"
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
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Reminders
