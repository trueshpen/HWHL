import { useState, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { updateData, saveData } from '../utils/storage'
import TagList from './TagList'
import {
  reminderTypes,
  getStatus,
  getStatusBadgeColor,
  getLastEventDate,
  getDaysSince,
  getPreviousEventDate,
  getNextPlannedDate,
  getSortedPlannedDates,
  getShowLovePrompt
} from '../utils/reminderUtils'
import './Reminders.css'

const filterPlannedDatesAfter = (plannedDates = [], cutoffDateStr) => {
  if (!cutoffDateStr) return plannedDates
  const cutoff = new Date(`${cutoffDateStr}T00:00:00`)
  cutoff.setHours(0, 0, 0, 0)
  return plannedDates.filter(dateStr => {
    const date = new Date(`${dateStr}T00:00:00`)
    date.setHours(0, 0, 0, 0)
    return date > cutoff
  })
}

const addPlannedDate = (plannedDates = [], newDateStr) => {
  if (!newDateStr) return plannedDates
  const set = new Set(plannedDates)
  set.add(newDateStr)
  return Array.from(set).sort()
}

function Reminders({ data, onUpdate, onExpandChange }) {
  const [editing, setEditing] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteType, setNewNoteType] = useState('like')
  const [isExpanded, setIsExpanded] = useState(false)
  const [planningType, setPlanningType] = useState(null)
  const [plannedDateInput, setPlannedDateInput] = useState('')
  const showLovePrompt = getShowLovePrompt(data.reminders?.general)
  const dateNightReminder = data.reminders?.dateNights
  
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
    
    let updatedReminder = {
      ...data.reminders[type],
      lastDone: now.toISOString(),
      events: [...existingEvents, eventDate].sort().reverse()
    }

    if (type === 'dateNights') {
      const plannedDates = updatedReminder.plannedDates || []
      if (plannedDates.length > 0) {
        const filtered = filterPlannedDatesAfter(plannedDates, eventDate)
        if (filtered.length !== plannedDates.length) {
          updatedReminder = {
            ...updatedReminder,
            plannedDates: filtered
          }
        }
      }
    }

    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: updatedReminder
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

  const handleAddNoteDirectly = (type, text, noteType) => {
    const reminder = data.reminders[type]
    const existingNotes = reminder?.notes || []
    const newNote = {
      type: noteType,
      text: text,
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

  const handleStartPlan = (type) => {
    const reminder = data.reminders[type]
    const upcomingDates = getSortedPlannedDates(reminder)
    setPlanningType(type)
    if (upcomingDates.length > 0) {
      setPlannedDateInput(upcomingDates[0])
    } else {
      const today = new Date()
      setPlannedDateInput(format(today, 'yyyy-MM-dd'))
    }
  }

  const applyReminderUpdate = (type, updater) => {
    const reminder = data.reminders[type]
    if (!reminder) return
    const updatedReminder = updater(reminder)
    const newData = {
      ...data,
      reminders: {
        ...data.reminders,
        [type]: updatedReminder
      }
    }
    saveData(newData)
    onUpdate(newData)
    return newData
  }

  useEffect(() => {
    if (!dateNightReminder) return
    const plannedDates = Array.isArray(dateNightReminder.plannedDates) ? dateNightReminder.plannedDates : []
    if (plannedDates.length === 0) return
    const lastEventDate = getLastEventDate(dateNightReminder)
    if (!lastEventDate) return
    const cutoffDate = lastEventDate.includes('T') ? lastEventDate.split('T')[0] : lastEventDate
    const cleanedDates = filterPlannedDatesAfter(plannedDates, cutoffDate)
    if (cleanedDates.length === plannedDates.length) return
    const updatedReminder = {
      ...dateNightReminder,
      plannedDates: cleanedDates
    }
    const newData = {
      ...data,
      reminders: {
        ...data.reminders,
        dateNights: updatedReminder
      }
    }
    saveData(newData)
    onUpdate(newData)
  }, [dateNightReminder, data, onUpdate])

  const handlePlanDateNight = (type) => {
    if (type !== 'dateNights' || !plannedDateInput) return
    const selectedDate = new Date(`${plannedDateInput}T00:00:00`)
    selectedDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      return
    }
    applyReminderUpdate(type, (reminder) => ({
      ...reminder,
      plannedDates: addPlannedDate(reminder.plannedDates || [], plannedDateInput)
    }))
    setPlanningType(null)
    setPlannedDateInput('')
  }

  const handleClearPlan = (type, dateToRemove = null) => {
    const reminder = data.reminders[type]
    const plannedDates = reminder?.plannedDates || []
    if (plannedDates.length === 0) return
    const targetDate = dateToRemove || plannedDates[0]
    applyReminderUpdate(type, (rem) => ({
      ...rem,
      plannedDates: (rem.plannedDates || []).filter(date => date !== targetDate)
    }))
    if (planningType === type) {
      setPlanningType(null)
      setPlannedDateInput('')
    }
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
          const upcomingPlannedDates = getSortedPlannedDates(reminder)
          const nextPlannedDate =
            type === 'dateNights'
              ? (getNextPlannedDate(reminder) || upcomingPlannedDates[0] || null)
              : null

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
                          <span>
                            {type === 'general'
                              ? 'Every day'
                              : (type === 'dateNights' && nextPlannedDate)
                                ? `Planned for ${format(new Date(nextPlannedDate + 'T00:00:00'), 'd MMM')}${upcomingPlannedDates.length > 1 ? ` (+${upcomingPlannedDates.length - 1} more)` : ''}`
                                : `Every ${reminder.frequency} days`}
                          </span>
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
                                    {isToday ? showLovePrompt : ''}
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

                  {type === 'dateNights' && reminder.enabled && (
                    <div className="date-plan-section">
                      {planningType === type ? (
                        <div className="plan-date-form">
                          <label>Schedule next date</label>
                          <input
                            type="date"
                            value={plannedDateInput}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => setPlannedDateInput(e.target.value)}
                          />
                          <div className="plan-actions">
                            <button
                              className="btn-secondary"
                              type="button"
                              onClick={() => {
                                setPlanningType(null)
                                setPlannedDateInput('')
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="btn-primary"
                              type="button"
                              onClick={() => handlePlanDateNight(type)}
                              disabled={!plannedDateInput}
                            >
                              Save plan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="plan-summary">
                          {nextPlannedDate ? (
                            <>
                              <span>
                                Next date night on{' '}
                                <strong>{format(new Date(nextPlannedDate + 'T00:00:00'), 'd MMM yyyy')}</strong>
                              </span>
                              {upcomingPlannedDates.length > 1 && (
                                <div className="plan-more">
                                  +{upcomingPlannedDates.length - 1} more scheduled
                                </div>
                              )}
                              <div className="plan-buttons">
                                <button className="btn-outline" onClick={() => handleStartPlan(type)}>
                                  Add / reschedule
                                </button>
                                <button className="btn-clear" onClick={() => handleClearPlan(type)}>
                                  Remove next
                                </button>
                              </div>
                              <div className="planned-date-chips">
                                {upcomingPlannedDates.map(date => (
                                  <div key={date} className="planned-date-chip">
                                    {format(new Date(date + 'T00:00:00'), 'd MMM')}
                                    <button
                                      type="button"
                                      onClick={() => handleClearPlan(type, date)}
                                      title="Remove this plan"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <button className="btn-plan" onClick={() => handleStartPlan(type)}>
                              Plan next date night
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
                      </div>
                      <TagList
                        items={reminder.notes || []}
                        onAdd={(text, noteType) => handleAddNoteDirectly(type, text, noteType)}
                        onUpdate={(id, text) => handleUpdateNoteText(type, id, text)}
                        onDelete={(id) => handleRemoveNote(type, id)}
                        placeholder="Add flower preference..."
                        allowTypeSelection={true}
                      />
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
