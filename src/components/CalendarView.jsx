import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, addDays } from 'date-fns'
import { loadData, loadDataSync, saveData, updateData, calculateAverageCycleLength, calculateNextExpectedStart } from '../utils/storage'
import { PHASES, getPhaseFromCycleDayWithLength, DEFAULT_PERIOD_DURATION_DAYS, PERIOD_NOTIFICATION_DAYS_BEFORE } from '../utils/constants'
import { getCycleDay, isInPastPeriod, isInFuturePeriod } from '../utils/cycleUtils'
import CycleTracker from './CycleTracker'
import ImportantDates from './ImportantDates'
import Reminders from './Reminders'
import './CalendarView.css'

function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [data, setData] = useState(loadDataSync())
  const [showEventMenu, setShowEventMenu] = useState(null) // Date for which to show event menu

  // Load data from server on mount (syncs with PC file)
  useEffect(() => {
    const syncData = async () => {
      const serverData = await loadData()
      setData(serverData)
    }
    syncData()
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of week for the month (Monday = 0, Sunday = 6)
  // Adjust getDay() where Sunday=0, Monday=1... to Monday=0, Tuesday=1... Sunday=6
  const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1
  const emptyDays = Array(firstDayOfWeek).fill(null)

  // Wrapper functions to use shared utilities with current data
  const checkInPastPeriod = (date) => isInPastPeriod(date, data.cycle.periods)
  const checkInFuturePeriod = (date) => isInFuturePeriod(date, data.cycle.expectedNextStart, data.cycle.cycleLength)
  const getCycleDayForDate = (date) => getCycleDay(date, data.cycle)

  const getEventsForDate = (date) => {
    const events = []
    const dateStr = format(date, 'yyyy-MM-dd')
    
    // Add reminder events
    const reminderEvents = getReminderEventsForDate(date)
    events.push(...reminderEvents)
    
    // Add important dates events
    if (data.importantDates && data.importantDates.length > 0) {
      data.importantDates.forEach(dateObj => {
        const eventDate = format(new Date(dateObj.date), 'yyyy-MM-dd')
        if (eventDate === dateStr) {
          events.push({ 
            type: 'important', 
            label: dateObj.name, 
            color: '#c44569',
            emoji: '📅'
          })
        }
      })
    }

    return events
  }

  const handleDayClick = (day, e) => {
    e.preventDefault()
    e.stopPropagation()
    // Toggle menu
    if (showEventMenu && isSameDay(day, showEventMenu)) {
      setShowEventMenu(null)
    } else {
      // Show event menu
      setShowEventMenu(day)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    if (!showEventMenu) return
    
    const handleClickOutside = (e) => {
      if (!e.target.closest('.calendar-day') && !e.target.closest('.event-menu')) {
        setShowEventMenu(null)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showEventMenu])

  // Helper function to update cycle data with recalculated values
  const updateCycleData = (newPeriods) => {
    const sortedPeriods = [...newPeriods].sort((a, b) => 
      new Date(b.startDate) - new Date(a.startDate)
    )
    const avgCycleLength = calculateAverageCycleLength(sortedPeriods)
    const nextExpected = calculateNextExpectedStart(sortedPeriods, avgCycleLength)
    
    const newData = updateData({
      cycle: {
        ...data.cycle,
        periods: sortedPeriods,
        cycleLength: avgCycleLength,
        expectedNextStart: nextExpected
      }
    })
    setData(newData)
  }

  const handleAddPeriodStart = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    const periods = data.cycle.periods || []
    
    // Check if this date is already a start date
    if (periods.some(p => p.startDate === dateStr)) {
      setShowEventMenu(null)
      return
    }
    
    // Check if this date overlaps with any existing period (prevent duplicates)
    const overlappingPeriod = periods.find(period => {
      const periodStart = new Date(period.startDate)
      periodStart.setHours(0, 0, 0, 0)
      const periodEnd = period.endDate 
        ? new Date(period.endDate)
        : addDays(periodStart, DEFAULT_PERIOD_DURATION_DAYS)
      periodEnd.setHours(23, 59, 59, 999)
      
      // Check if new date falls within the period range
      return newDate >= periodStart && newDate <= periodEnd
    })
    
    if (overlappingPeriod) {
      // Don't allow adding a period that overlaps with an existing one
      setShowEventMenu(null)
      return
    }
    
    // Add new period with automatic end date
    const endDate = format(addDays(date, DEFAULT_PERIOD_DURATION_DAYS), 'yyyy-MM-dd')
    const newPeriod = { startDate: dateStr, endDate: endDate }
    updateCycleData([...periods, newPeriod])
    
    setShowEventMenu(null)
  }

  const handleAddPeriodEnd = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const periods = data.cycle.periods || []
    
    // Find the most recent period that needs an end date update
    // This includes periods without an end date OR periods with auto-generated end dates (within 5 days of start)
    const sortedPeriods = [...periods].sort((a, b) => 
      new Date(b.startDate) - new Date(a.startDate)
    )
    
    const periodToUpdate = sortedPeriods.find(p => {
      const startDate = new Date(p.startDate)
      if (new Date(p.startDate) > new Date(dateStr)) return false // End date must be after start
      
      if (!p.endDate) {
        // Period without end date
        return true
      }
      
      // Check if end date is auto-generated
      const autoEndDate = format(addDays(startDate, DEFAULT_PERIOD_DURATION_DAYS), 'yyyy-MM-dd')
      if (p.endDate === autoEndDate) {
        // This is an auto-generated end date, allow updating it
        return true
      }
      
      return false
    })
    
    if (periodToUpdate) {
      // Update existing period's end date
      const newPeriods = periods.map(p => 
        p.startDate === periodToUpdate.startDate ? { ...p, endDate: dateStr } : p
      )
      updateCycleData(newPeriods)
    } else {
      // No period to update, create new period with both start and end
      const newPeriod = { startDate: dateStr, endDate: dateStr }
      updateCycleData([...periods, newPeriod])
    }
    
    setShowEventMenu(null)
  }

  const handleRemovePeriod = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const periods = data.cycle.periods || []
    
    // Find periods that have this date as start or end
    const periodsToRemove = periods.filter(p => 
      p.startDate === dateStr || p.endDate === dateStr
    )
    
    if (periodsToRemove.length > 0) {
      // Remove all periods that match this date
      const newPeriods = periods.filter(p => 
        p.startDate !== dateStr && p.endDate !== dateStr
      )
      updateCycleData(newPeriods)
    }
    
    setShowEventMenu(null)
  }

  const getReminderEventsForDate = (date) => {
    const events = []
    const dateStr = format(date, 'yyyy-MM-dd')
    
    const reminderTypes = {
      flowers: { emoji: '🌸', color: '#ff6b9d' },
      surprises: { emoji: '🎁', color: '#fdcb6e' },
      dateNights: { emoji: '💑', color: '#c44569' },
      general: { emoji: '💕', color: '#f8b5c0' },
    }

    Object.entries(reminderTypes).forEach(([type, info]) => {
      const reminder = data.reminders[type]
      if (reminder && reminder.events && Array.isArray(reminder.events)) {
        if (reminder.events.includes(dateStr)) {
          events.push({ 
            type: type,
            reminderType: type,
            label: info.emoji, 
            color: info.color,
            emoji: info.emoji
          })
        }
      }
    })

    return events
  }

  const handleAddReminderEvent = (date, type) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const reminder = data.reminders[type]
    const existingEvents = reminder?.events || []
    
    // Don't add if already exists
    if (existingEvents.includes(dateStr)) {
      return
    }
    
    // Update lastDone to the event date (or keep the most recent if it's newer)
    const eventDate = new Date(dateStr + 'T00:00:00')
    const currentLastDone = reminder?.lastDone ? new Date(reminder.lastDone) : null
    const newLastDone = (!currentLastDone || eventDate > currentLastDone) 
      ? eventDate.toISOString() 
      : currentLastDone.toISOString()
    
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...data.reminders[type],
          lastDone: newLastDone,
          events: [...existingEvents, dateStr].sort().reverse() // Sort descending (newest first)
        }
      }
    })
    setData(newData)
    // Force save to ensure file is updated
    saveData(newData)
  }

  const handleRemoveReminderEvent = (date, type) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const reminder = data.reminders[type]
    const existingEvents = reminder?.events || []
    
    // Remove the date from events
    const newEvents = existingEvents.filter(eventDate => eventDate !== dateStr)
    
    // Update lastDone if we removed today's event
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = format(today, 'yyyy-MM-dd')
    let newLastDone = reminder?.lastDone
    if (dateStr === todayStr && newEvents.length > 0) {
      // If we removed today, update lastDone to the previous event
      const previousEventDate = newEvents[0]
      newLastDone = previousEventDate ? new Date(previousEventDate + 'T00:00:00').toISOString() : null
    } else if (dateStr === todayStr && newEvents.length === 0) {
      newLastDone = null
    }
    
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...data.reminders[type],
          lastDone: newLastDone,
          events: newEvents
        }
      }
    })
    setData(newData)
    // Force save to ensure file is updated
    saveData(newData)
  }

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            ←
          </button>
          <div className="calendar-header-center">
            <h2>{format(currentDate, 'MMMM yyyy')}</h2>
            {!isSameDay(startOfMonth(currentDate), startOfMonth(new Date())) && (
              <button 
                className="go-to-today-btn"
                onClick={() => setCurrentDate(new Date())}
                title="Go to current month"
              >
                Today
              </button>
            )}
          </div>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            →
          </button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
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
              const inPastPeriod = checkInPastPeriod(day)
              const inFuturePeriod = checkInFuturePeriod(day)
              const cycleDay = getCycleDayForDate(day)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${isToday ? 'today' : ''} ${showEventMenu && isSameDay(day, showEventMenu) ? 'selected' : ''} ${inPastPeriod ? 'period-past' : ''} ${inFuturePeriod ? 'period-future' : ''}`}
                  onClick={(e) => handleDayClick(day, e)}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  {cycleDay !== null && (() => {
                    // Use actual cycle length for all calculations
                    const cycleLength = data.cycle.cycleLength || 28
                    // Normalize cycle day to cycle length range
                    const normalizedDay = ((cycleDay - 1) % cycleLength) + 1
                    // Get phase using actual cycle length (proportionally maps to 28-day phases)
                    const phase = getPhaseFromCycleDayWithLength(normalizedDay, cycleLength)
                    // Use actual cycle day for display
                    const displayDay = normalizedDay
                    return (
                      <div className="cycle-day-info">
                        {phase && (
                          <span className="cycle-phase-icon">{PHASES[phase].emoji}</span>
                        )}
                        <span className="cycle-day-number">{displayDay}</span>
                      </div>
                    )
                  })()}
                  <div className="day-events">
                    {events.map((event, i) => (
                      <div
                        key={i}
                        className={`event-dot ${event.emoji ? 'emoji' : ''}`}
                        style={event.emoji ? {} : { backgroundColor: event.color }}
                        title={event.label}
                      >
                        {event.emoji || ''}
                      </div>
                    ))}
                  </div>
                  {/* Notification dot in right bottom corner */}
                  {data.cycle.expectedNextStart && (() => {
                    const nextStart = new Date(data.cycle.expectedNextStart)
                    const notificationDate = addDays(nextStart, -PERIOD_NOTIFICATION_DAYS_BEFORE)
                    if (isSameDay(day, notificationDate)) {
                      return (
                        <div 
                          className="notification-dot"
                          title={`${PERIOD_NOTIFICATION_DAYS_BEFORE} Days Before`}
                        ></div>
                      )
                    }
                    return null
                  })()}
                  {showEventMenu && isSameDay(day, showEventMenu) && (
                    <div className="event-menu" onClick={(e) => e.stopPropagation()}>
                      <div className="menu-section">
                        <div className="menu-section-title">Cycle</div>
                        <div className="cycle-buttons">
                          <button onClick={() => { handleAddPeriodStart(day); setShowEventMenu(null); }} className="cycle-btn" title="Mark as Start">
                            Start
                          </button>
                          <button onClick={() => { handleAddPeriodEnd(day); setShowEventMenu(null); }} className="cycle-btn" title="Mark as End">
                            End
                          </button>
                          <button onClick={() => { handleRemovePeriod(day); setShowEventMenu(null); }} className="cycle-btn remove" title="Remove Period">
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="menu-divider"></div>
                      <div className="menu-section">
                        <div className="menu-section-title">Reminders</div>
                        <div className="reminders-grid">
                          {[
                            { type: 'flowers', emoji: '🌸', addLabel: 'Give flowers', removeLabel: 'No flowers' },
                            { type: 'surprises', emoji: '🎁', addLabel: 'Make a surprise', removeLabel: 'No surprises' },
                            { type: 'dateNights', emoji: '💑', addLabel: 'Date night', removeLabel: 'No date night' },
                            { type: 'general', emoji: '💕', addLabel: 'Show love', removeLabel: 'No love showed :(' },
                          ].map(({ type, emoji, addLabel, removeLabel }) => {
                            const dateEvents = getReminderEventsForDate(day)
                            const hasEvent = dateEvents.some(e => e.type === type)
                            
                            return (
                              <button
                                key={type}
                                onClick={() => {
                                  if (hasEvent) {
                                    handleRemoveReminderEvent(day, type)
                                  } else {
                                    handleAddReminderEvent(day, type)
                                  }
                                  setShowEventMenu(null)
                                }}
                                className={`reminder-icon-btn ${hasEvent ? 'remove' : 'add'}`}
                                title={hasEvent ? removeLabel : addLabel}
                              >
                                {emoji}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <button onClick={() => setShowEventMenu(null)} className="period-btn cancel">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="calendar-sidebar">
        <CycleTracker data={data} onUpdate={setData} />
        <ImportantDates data={data} onUpdate={setData} />
        <Reminders data={data} onUpdate={setData} />
      </div>
    </div>
  )
}

export default CalendarView

