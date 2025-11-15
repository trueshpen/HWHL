import { format, isSameDay } from 'date-fns'
import { updateData } from '../utils/storage'
import {
  reminderTypes,
  shouldShowTodayReminder,
  getStatus,
  getLastEventDate
} from '../utils/reminderUtils'
import './TodayReminders.css'

function TodayReminders({ data, onUpdate }) {
  if (!data?.reminders) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pendingReminders = Object.entries(reminderTypes)
    .map(([type, info]) => {
      const reminder = data.reminders[type]
      if (!shouldShowTodayReminder(reminder, type)) {
        return null
      }
      const status = getStatus(reminder, type)
      const lastEventDate = getLastEventDate(reminder)
      return {
        type,
        info,
        reminder,
        status,
        lastEventDate
      }
    })
    .filter(Boolean)

  const todayImportantDates = (data.importantDates || [])
    .map(dateObj => {
      if (!dateObj.date) return null
      const originalDate = new Date(dateObj.date)
      const thisYearDate = new Date(today.getFullYear(), originalDate.getMonth(), originalDate.getDate())
      thisYearDate.setHours(0, 0, 0, 0)
      if (!isSameDay(thisYearDate, today)) return null
      const isBirthday = dateObj.name?.toLowerCase().includes('birthday')
      return {
        id: dateObj.id,
        name: dateObj.name,
        notes: dateObj.gifts,
        emoji: isBirthday ? '🎉' : '📅'
      }
    })
    .filter(Boolean)

  const totalItems = pendingReminders.length + todayImportantDates.length

  const handleMarkDone = (type) => {
    const reminder = data.reminders[type]
    if (!reminder) return

    const now = new Date()
    const eventDate = now.toISOString().split('T')[0]
    const existingEvents = reminder.events || []

    if (type !== 'general' && existingEvents.includes(eventDate)) {
      return
    }

    const newEvents = [...existingEvents, eventDate].sort().reverse()

    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...reminder,
          lastDone: now.toISOString(),
          events: newEvents
        }
      }
    })
    onUpdate(newData)
  }

  return (
    <div className="today-reminders card">
      <div className="today-header">
        <h3>✨ Today</h3>
        {totalItems > 0 && (
          <span className="today-count">{totalItems}</span>
        )}
      </div>

      {totalItems === 0 ? (
        <div className="today-empty">
          <span className="emoji">🎉</span>
          <div>All reminders done for today!</div>
        </div>
      ) : (
        <div className="today-content">
          {pendingReminders.length > 0 && (
            <>
              <div className="today-section-title">Reminders</div>
              <div className="today-list">
                {pendingReminders.map(({ type, info, status, lastEventDate }) => (
                  <div key={type} className="today-item">
                    <div className="today-info">
                      <span className="today-emoji">{info.emoji}</span>
                      <div className="today-texts">
                        <span className="today-label">{info.label}</span>
                        {type !== 'general' && lastEventDate && (
                          <span className="today-subtext">
                            Last: {format(new Date(lastEventDate.includes('T') ? lastEventDate : `${lastEventDate}T00:00:00`), 'd MMM')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="today-actions">
                      {status && status.message && type !== 'general' && (
                        <span className={`today-status ${status.status}`}>
                          {status.message}
                        </span>
                      )}
                      <button
                        className="today-done-btn"
                        onClick={() => handleMarkDone(type)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {todayImportantDates.length > 0 && (
            <>
              <div className="today-section-title">Important Today</div>
              <div className="today-important-list">
                {todayImportantDates.map(event => (
                  <div key={event.id} className="today-important-item">
                    <div className="today-important-info">
                      <span className="today-important-emoji">{event.emoji}</span>
                      <div className="today-important-texts">
                        <span className="today-label">{event.name}</span>
                        <span className="today-subtext">Happening today</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default TodayReminders

