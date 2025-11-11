import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, addDays, differenceInDays } from 'date-fns'
import { loadData, saveData, updateData, calculateAverageCycleLength, calculateNextExpectedStart } from '../utils/storage'
import CycleTracker from './CycleTracker'
import ImportantDates from './ImportantDates'
import Reminders from './Reminders'
import './CalendarView.css'

// Phase definitions (same as CycleTracker)
const PHASES = {
  'period': { name: 'Moon Days', days: [1, 2, 3, 4, 5], emoji: '🌛' },
  'post-period': { name: 'Fresh Start', days: [6, 7, 8, 9, 10, 11, 12, 13], emoji: '🌱' },
  'ovulation': { name: 'Shining Peak', days: [14, 15, 16], emoji: '✨' },
  'pre-period': { name: 'Wind Down', days: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28], emoji: '🍃' },
}

// Get phase from cycle day (expects normalized day 1-28)
const getPhaseFromCycleDay = (cycleDay) => {
  if (!cycleDay) return null
  for (const [phaseKey, phase] of Object.entries(PHASES)) {
    if (phase.days.includes(cycleDay)) {
      return phaseKey
    }
  }
  return null
}

function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [data, setData] = useState(loadData())
  const [showPeriodMenu, setShowPeriodMenu] = useState(null) // Date for which to show menu
  const [showEventMenu, setShowEventMenu] = useState(null) // Date for which to show event menu

  // Load data from JSON file on mount if available and replace current data
  useEffect(() => {
    const loadFileData = async () => {
      try {
        const response = await fetch('/wife-happiness-data.json')
        if (response.ok) {
          const fileData = await response.json()
          // Always use file data if it exists and has periods
          if (fileData.cycle && fileData.cycle.periods && fileData.cycle.periods.length > 0) {
            // Recalculate cycle length and expected next start
            const avgCycleLength = calculateAverageCycleLength(fileData.cycle.periods)
            const nextExpected = calculateNextExpectedStart(fileData.cycle.periods, avgCycleLength)
            fileData.cycle.cycleLength = avgCycleLength
            fileData.cycle.expectedNextStart = nextExpected
            // Save to localStorage and update state
            saveData(fileData)
            setData(fileData)
          }
        }
      } catch (error) {
        // File not found or error - use localStorage data
        console.log('Using localStorage data:', error)
      }
    }
    loadFileData()
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of week for the month (Monday = 0, Sunday = 6)
  // Adjust getDay() where Sunday=0, Monday=1... to Monday=0, Tuesday=1... Sunday=6
  const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1
  const emptyDays = Array(firstDayOfWeek).fill(null)

  // Check if date is in a past period
  const isInPastPeriod = (date) => {
    if (!data.cycle.periods || data.cycle.periods.length === 0) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    return data.cycle.periods.some(period => {
      const start = new Date(period.startDate)
      const end = period.endDate ? new Date(period.endDate) : addDays(start, 4) // Default 4 days (5 total including start and end)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      
      // Check if date is within the period range AND the period is in the past
      const isInRange = checkDate >= start && checkDate <= end
      const isPast = end < today
      return isInRange && isPast
    })
  }

  // Check if date is in a future expected period (all future cycles)
  const isInFuturePeriod = (date) => {
    if (!data.cycle.expectedNextStart || !data.cycle.cycleLength) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    // Calculate all future period starts (up to 12 months ahead)
    const futurePeriods = []
    let currentStart = new Date(data.cycle.expectedNextStart)
    const maxDate = addDays(today, 365) // Look up to 1 year ahead
    
    while (currentStart <= maxDate) {
      const periodEnd = addDays(currentStart, 4) // 4 days after start (5 total)
      futurePeriods.push({
        start: new Date(currentStart),
        end: periodEnd
      })
      // Move to next cycle
      currentStart = addDays(currentStart, data.cycle.cycleLength)
    }
    
    // Check if date falls within any future period
    return futurePeriods.some(period => {
      period.start.setHours(0, 0, 0, 0)
      period.end.setHours(23, 59, 59, 999)
      return checkDate >= period.start && checkDate <= period.end && period.start > today
    })
  }

  // Calculate cycle day number (day 1 = period start, count until next period start)
  // Works for both past periods and future expected periods
  const getCycleDay = (date) => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // First check past periods
    if (data.cycle.periods && data.cycle.periods.length > 0) {
      const sortedPeriods = [...data.cycle.periods].sort((a, b) => 
        new Date(b.startDate) - new Date(a.startDate)
      )
      
      // Find the most recent period start that is on or before the check date
      let periodStart = null
      let nextPeriodStart = null
      
      for (let i = 0; i < sortedPeriods.length; i++) {
        const periodStartDate = new Date(sortedPeriods[i].startDate)
        periodStartDate.setHours(0, 0, 0, 0)
        
        if (checkDate >= periodStartDate) {
          periodStart = periodStartDate
          
          // Find the next period start (if any)
          if (i > 0) {
            nextPeriodStart = new Date(sortedPeriods[i - 1].startDate)
            nextPeriodStart.setHours(0, 0, 0, 0)
          }
          break
        }
      }
      
      if (periodStart) {
        // Calculate days since period start
        const daysSinceStart = differenceInDays(checkDate, periodStart) + 1 // +1 because start day is day 1
        
        // If we have a next period start, make sure we don't exceed it
        if (nextPeriodStart && checkDate >= nextPeriodStart) {
          // This date is in the next cycle, fall through to future periods check
        } else {
          return daysSinceStart
        }
      }
    }
    
    // If date is in the future, calculate based on expected cycles
    if (checkDate > today && data.cycle.expectedNextStart && data.cycle.cycleLength) {
      let currentStart = new Date(data.cycle.expectedNextStart)
      const maxDate = addDays(today, 365)
      
      while (currentStart <= maxDate) {
        currentStart.setHours(0, 0, 0, 0)
        const periodEnd = addDays(currentStart, 4)
        periodEnd.setHours(23, 59, 59, 999)
        const nextPeriodStart = addDays(currentStart, data.cycle.cycleLength)
        nextPeriodStart.setHours(0, 0, 0, 0)
        
        // Check if date is within this cycle (from current period start to next period start)
        if (checkDate >= currentStart && checkDate < nextPeriodStart) {
          // Calculate cycle day (day 1 = period start)
          const daysSinceStart = differenceInDays(checkDate, currentStart) + 1
          return daysSinceStart
        }
        
        // Move to next cycle
        currentStart = nextPeriodStart
      }
    }
    
    return null
  }

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
    if ((showPeriodMenu && isSameDay(day, showPeriodMenu)) || (showEventMenu && isSameDay(day, showEventMenu))) {
      setShowPeriodMenu(null)
      setShowEventMenu(null)
    } else {
      // Show event menu directly (simplified)
      setShowEventMenu(day)
      setShowPeriodMenu(null)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPeriodMenu && !e.target.closest('.calendar-day') && !e.target.closest('.period-menu') && !e.target.closest('.event-menu')) {
        setShowPeriodMenu(null)
      }
      if (showEventMenu && !e.target.closest('.calendar-day') && !e.target.closest('.event-menu') && !e.target.closest('.period-menu')) {
        setShowEventMenu(null)
      }
    }
    if (showPeriodMenu || showEventMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showPeriodMenu, showEventMenu])

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
      setShowPeriodMenu(null)
      return
    }
    
    // Check if this date overlaps with any existing period (prevent duplicates)
    const overlappingPeriod = periods.find(period => {
      const periodStart = new Date(period.startDate)
      periodStart.setHours(0, 0, 0, 0)
      const periodEnd = period.endDate 
        ? new Date(period.endDate)
        : addDays(periodStart, 4) // Default 4 days (5 total including start and end)
      periodEnd.setHours(23, 59, 59, 999)
      
      // Check if new date falls within the period range
      return newDate >= periodStart && newDate <= periodEnd
    })
    
    if (overlappingPeriod) {
      // Don't allow adding a period that overlaps with an existing one
      setShowPeriodMenu(null)
      return
    }
    
    // Add new period with automatic end date (4 days after start = 5 days total including start and end)
    const endDate = format(addDays(date, 4), 'yyyy-MM-dd')
    const newPeriod = { startDate: dateStr, endDate: endDate }
    updateCycleData([...periods, newPeriod])
    
    setShowPeriodMenu(null)
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
      
      // Check if end date is auto-generated (exactly 4 days after start, meaning 5 days total)
      const autoEndDate = format(addDays(startDate, 4), 'yyyy-MM-dd')
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
    
    setShowPeriodMenu(null)
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
    
    setShowPeriodMenu(null)
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
  }

  const handleRemoveReminderEvent = (date, type) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const reminder = data.reminders[type]
    const existingEvents = reminder?.events || []
    
    // Remove the date from events
    const newEvents = existingEvents.filter(eventDate => eventDate !== dateStr)
    
    const newData = updateData({
      reminders: {
        ...data.reminders,
        [type]: {
          ...data.reminders[type],
          events: newEvents
        }
      }
    })
    setData(newData)
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
              const inPastPeriod = isInPastPeriod(day)
              const inFuturePeriod = isInFuturePeriod(day)
              const cycleDay = getCycleDay(day)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${isToday ? 'today' : ''} ${(showPeriodMenu && isSameDay(day, showPeriodMenu)) || (showEventMenu && isSameDay(day, showEventMenu)) ? 'selected' : ''} ${inPastPeriod ? 'period-past' : ''} ${inFuturePeriod ? 'period-future' : ''}`}
                  onClick={(e) => handleDayClick(day, e)}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  {cycleDay !== null && (() => {
                    // Normalize cycle day to 1-28 range for phase calculation (phases are always 28 days)
                    const normalizedDay = ((cycleDay - 1) % 28) + 1
                    const phase = getPhaseFromCycleDay(normalizedDay)
                    // Use actual cycle day for display, wrapping around based on cycle length
                    const cycleLength = data.cycle.cycleLength || 28
                    const displayDay = ((cycleDay - 1) % cycleLength) + 1
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
                  {/* 8 days before notification dot in right bottom corner */}
                  {data.cycle.expectedNextStart && (() => {
                    const nextStart = new Date(data.cycle.expectedNextStart)
                    const notificationDate = addDays(nextStart, -8)
                    if (isSameDay(day, notificationDate)) {
                      return (
                        <div 
                          className="notification-dot"
                          title="8 Days Before"
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

