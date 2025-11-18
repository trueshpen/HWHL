import { format, isSameDay, addDays } from 'date-fns'
import { updateData } from '../utils/storage'
import { PERIOD_NOTIFICATION_DAYS_BEFORE } from '../utils/constants'
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

  // Check for 8-day alert
  const has8DayAlert = data.cycle?.expectedNextStart && (() => {
    const nextStart = new Date(data.cycle.expectedNextStart)
    const notificationDate = addDays(nextStart, -PERIOD_NOTIFICATION_DAYS_BEFORE)
    notificationDate.setHours(0, 0, 0, 0)
    return isSameDay(notificationDate, today)
  })()

  const totalItems = pendingReminders.length + todayImportantDates.length + (has8DayAlert ? 1 : 0)

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
                {pendingReminders.map(({ type, info, reminder, status, lastEventDate }) => (
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
                        {type === 'dateNights' && reminder?.plannedDate && (
                          <span className="today-subtext">
                            Planned for {format(new Date(reminder.plannedDate + 'T00:00:00'), 'd MMM')}
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

          {has8DayAlert && (
            <>
              <div className="today-section-title">Alerts</div>
              <div className="today-list">
                <div className="today-item today-alert">
                  <div className="today-info">
                    <span className="today-emoji">🔔</span>
                    <div className="today-texts">
                      <span className="today-label">{PERIOD_NOTIFICATION_DAYS_BEFORE} Days Before</span>
                      <span className="today-subtext">
                        Period expected on {format(new Date(data.cycle.expectedNextStart), 'd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
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

