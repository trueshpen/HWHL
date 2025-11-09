import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, addDays } from 'date-fns'
import { loadData, updateData } from '../utils/storage'
import CycleTracker from './CycleTracker'
import ImportantDates from './ImportantDates'
import Reminders from './Reminders'
import './CalendarView.css'

function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [data, setData] = useState(loadData())
  const [selectedDate, setSelectedDate] = useState(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of week for the month
  const firstDayOfWeek = monthStart.getDay()
  const emptyDays = Array(firstDayOfWeek).fill(null)

  const getEventsForDate = (date) => {
    const events = []
    
    // Cycle events
    if (data.cycle.startDate) {
      const cycleStart = new Date(data.cycle.startDate)
      if (isSameDay(date, cycleStart)) {
        events.push({ type: 'cycle', label: 'Cycle Start', color: '#ff6b9d' })
      }
    }
    if (data.cycle.expectedNextStart) {
      const nextStart = new Date(data.cycle.expectedNextStart)
      if (isSameDay(date, nextStart)) {
        events.push({ type: 'cycle', label: 'Expected Start', color: '#c44569' })
      }
      // 8 days before notification
      const notificationDate = addDays(nextStart, -8)
      if (isSameDay(date, notificationDate)) {
        events.push({ type: 'cycle', label: '8 Days Before', color: '#f8b5c0' })
      }
    }

    // Important dates
    data.importantDates.forEach(dateObj => {
      const eventDate = new Date(dateObj.date)
      if (isSameDay(date, eventDate)) {
        events.push({ type: 'important', label: dateObj.name, color: '#00b894' })
      }
      // Notifications
      const monthBefore = addDays(eventDate, -30)
      const weekBefore = addDays(eventDate, -7)
      const dayBefore = addDays(eventDate, -1)
      
      if (isSameDay(date, monthBefore)) {
        events.push({ type: 'notification', label: `${dateObj.name} - 1 month`, color: '#fdcb6e' })
      }
      if (isSameDay(date, weekBefore)) {
        events.push({ type: 'notification', label: `${dateObj.name} - 1 week`, color: '#fdcb6e' })
      }
      if (isSameDay(date, dayBefore)) {
        events.push({ type: 'notification', label: `${dateObj.name} - tomorrow`, color: '#fdcb6e' })
      }
    })

    return events
  }

  const handleDataUpdate = (newData) => {
    setData(newData)
  }

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            ←
          </button>
          <h2>{format(currentDate, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            →
          </button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-days">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty"></div>
            ))}
            {daysInMonth.map(day => {
              const isToday = isSameDay(day, new Date())
              const events = getEventsForDate(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${isToday ? 'today' : ''} ${selectedDate && isSameDay(day, selectedDate) ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  <div className="day-events">
                    {events.map((event, i) => (
                      <div
                        key={i}
                        className="event-dot"
                        style={{ backgroundColor: event.color }}
                        title={event.label}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="calendar-sidebar">
        <CycleTracker data={data} onUpdate={handleDataUpdate} />
        <ImportantDates data={data} onUpdate={handleDataUpdate} />
        <Reminders data={data} onUpdate={handleDataUpdate} />
      </div>
    </div>
  )
}

export default CalendarView

