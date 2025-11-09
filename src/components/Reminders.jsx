import { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { loadData, updateData } from '../utils/storage'
import './Reminders.css'

const reminderTypes = {
  flowers: { emoji: '🌸', label: 'Flowers', defaultFrequency: 7 },
  surprises: { emoji: '🎁', label: 'Small Surprises', defaultFrequency: 14 },
  dateNights: { emoji: '💑', label: 'Date Nights', defaultFrequency: 7 },
  general: { emoji: '💕', label: 'General Reminders', defaultFrequency: 1 },
}

function Reminders({ data, onUpdate }) {
  const [editing, setEditing] = useState(null)

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
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...data.reminders[type],
          lastDone: new Date().toISOString(),
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

  const getDaysSince = (lastDone) => {
    if (!lastDone) return null
    return differenceInDays(new Date(), new Date(lastDone))
  }

  const getStatus = (reminder) => {
    if (!reminder.enabled) return { status: 'disabled', message: 'Disabled' }
    if (!reminder.lastDone) return { status: 'pending', message: 'Never done' }
    
    const daysSince = getDaysSince(reminder.lastDone)
    if (daysSince >= reminder.frequency) {
      return { status: 'due', message: `Due (${daysSince} days ago)` }
    }
    return { status: 'ok', message: `${reminder.frequency - daysSince} days until due` }
  }

  return (
    <div className="reminders card">
      <div className="card-header">
        <h3>💭 Reminders</h3>
      </div>

      <div className="reminders-list">
        {Object.entries(reminderTypes).map(([type, info]) => {
          const reminder = data.reminders[type]
          const status = getStatus(reminder)
          const daysSince = getDaysSince(reminder.lastDone)

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
                    <span className={`status-badge ${status.status}`}>
                      {status.message}
                    </span>
                  </div>

                  <div className="reminder-controls">
                    {editing === type ? (
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
                          <span>Every {reminder.frequency} days</span>
                          {reminder.lastDone && (
                            <span className="last-done">
                              Last: {format(new Date(reminder.lastDone), 'MMM d')}
                            </span>
                          )}
                        </div>
                        <div className="reminder-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(type)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-done"
                            onClick={() => handleMarkDone(type)}
                          >
                            Mark Done
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {type === 'general' && (
                    <div className="general-reminder-text">
                      <p>💕 She is the love of my life</p>
                      <p>💕 I must make her happy EVERY DAY</p>
                      <p>💕 Support her, take care of her</p>
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

