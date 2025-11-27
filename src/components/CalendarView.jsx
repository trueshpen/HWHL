import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, addDays, startOfWeek, endOfWeek, isSameMonth, differenceInDays } from 'date-fns'
import { updateData, calculateAverageCycleLength, calculateNextExpectedStart } from '../utils/storage'
import { PHASES, getPhaseFromCycleDayWithLength, DEFAULT_PERIOD_DURATION_DAYS, PERIOD_NOTIFICATION_DAYS_BEFORE } from '../utils/constants'
import { reminderTypes } from '../utils/reminderUtils'
import { getCycleDay, isInPastPeriod, isInFuturePeriod, getAveragePeriodDurationOffset } from '../utils/cycleUtils'
import CycleTracker from './CycleTracker'
import ImportantDates from './ImportantDates'
import Reminders from './Reminders'
import TodayReminders from './TodayReminders'
import './CalendarView.css'

const REMINDER_SEGMENT_TYPES = ['flowers', 'surprises', 'general', 'dateNights']

const addPlannedDateToList = (dates = [], newDateStr) => {
  if (!newDateStr) return dates
  if (dates.includes(newDateStr)) return dates
  return [...dates, newDateStr].sort()
}

const filterPlannedDatesAfterDate = (dates = [], cutoffStr) => {
  if (!cutoffStr) return dates
  const cutoff = new Date(`${cutoffStr}T00:00:00`)
  cutoff.setHours(0, 0, 0, 0)
  return dates.filter(dateStr => {
    const date = new Date(`${dateStr}T00:00:00`)
    date.setHours(0, 0, 0, 0)
    return date > cutoff
  })
}

const removePlannedDateFromList = (dates = [], targetStr) => {
  if (!targetStr) return dates
  return dates.filter(date => date !== targetStr)
}

const PERIOD_START_SHIFT_TOLERANCE_DAYS = 3

function CalendarView({ data, onUpdate }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showEventMenu, setShowEventMenu] = useState(null) // Date for which to show event menu
  const [menuAnchor, setMenuAnchor] = useState(null) // Element that triggered the menu
  const menuRef = useRef(null)
  const [expandedSections, setExpandedSections] = useState({
    cycle: false,
    importantDates: false,
    reminders: false
  })
  const [isMobileView, setIsMobileView] = useState(false)
  const [todayTotals, setTodayTotals] = useState(0)
  const [todayCardPosition, setTodayCardPosition] = useState('top')
  const todayCountRef = useRef(0)
  const todaySlideTimeoutRef = useRef(null)
  const clearTodaySlideTimeout = () => {
    if (todaySlideTimeoutRef.current) {
      clearTimeout(todaySlideTimeoutRef.current)
      todaySlideTimeoutRef.current = null
    }
  }

  const handleSectionExpand = (section, expanded) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: expanded
    }))
  }

  const handleTodayTotalsChange = (total) => {
    setTodayTotals(total)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleChange = (event) => setIsMobileView(event.matches)
    setIsMobileView(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isMobileView) {
      clearTodaySlideTimeout()
      setTodayCardPosition('top')
      todayCountRef.current = todayTotals
      return
    }

    const previousTotal = todayCountRef.current
    if (todayTotals === 0) {
      if (previousTotal > 0) {
        setTodayCardPosition('sliding')
        clearTodaySlideTimeout()
        todaySlideTimeoutRef.current = setTimeout(() => {
          setTodayCardPosition('docked')
        }, 550)
      } else {
        setTodayCardPosition('docked')
      }
    } else {
      clearTodaySlideTimeout()
      setTodayCardPosition('top')
    }

    todayCountRef.current = todayTotals

    return () => {
      clearTodaySlideTimeout()
    }
  }, [todayTotals, isMobileView])

  const hasExpandedSection = expandedSections.cycle || expandedSections.importantDates || expandedSections.reminders
  const mobileTodayClassNames = ['mobile-today-section', todayCardPosition, todayTotals === 0 ? 'empty' : 'has-items']

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  // Get the calendar view start (Monday of the week containing month start)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  // Get the calendar view end (Sunday of the week containing month end)
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  // Generate all days for the calendar view (including previous and next month days)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  // Calculate number of weeks (rows) in the calendar
  const numberOfWeeks = Math.ceil(calendarDays.length / 7)

  // Wrapper functions to use shared utilities with current data
  const cyclePeriods = data.cycle.periods || []
  const averagePeriodDuration = getAveragePeriodDurationOffset(cyclePeriods)
  const checkInPastPeriod = (date) => isInPastPeriod(date, cyclePeriods)
  const checkInFuturePeriod = (date) => isInFuturePeriod(
    date,
    data.cycle.expectedNextStart,
    data.cycle.cycleLength,
    averagePeriodDuration,
    cyclePeriods
  )
  const getCycleDayForDate = (date) => getCycleDay(date, data.cycle)
  const expectedNextStartDate = data.cycle.expectedNextStart
    ? (() => {
        const nextStart = new Date(data.cycle.expectedNextStart)
        nextStart.setHours(0, 0, 0, 0)
        return nextStart
      })()
    : null
  const plannedDateNightDates = data.reminders?.dateNights?.plannedDates || []
  
  // Check if date is a period start date
  const isPeriodStart = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return data.cycle.periods?.some(p => p.startDate === dateStr) || false
  }
  
  // Check if date is a period end date
  const isPeriodEnd = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return data.cycle.periods?.some(p => p.endDate === dateStr) || false
  }

  const isPlannedPeriodStartDay = (date) => {
    const { expectedNextStart, cycleLength } = data.cycle || {}
    if (!expectedNextStart || !cycleLength || cycleLength <= 0) return false

    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    if (checkDate < todayStart) return false

    let currentStart = new Date(expectedNextStart)
    currentStart.setHours(0, 0, 0, 0)
    const limitDate = addDays(currentStart, 365)

    while (currentStart <= limitDate) {
      if (isSameDay(checkDate, currentStart)) {
        return true
      }
      currentStart = addDays(currentStart, cycleLength)
    }

    return false
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
        // Check if this important date matches this day (considering yearly recurrence)
        const eventDate = new Date(dateObj.date)
        const currentYear = date.getFullYear()
        const eventMonth = eventDate.getMonth()
        const eventDay = eventDate.getDate()
        
        // Create date for this year
        const thisYearDate = new Date(currentYear, eventMonth, eventDay)
        const thisYearDateStr = format(thisYearDate, 'yyyy-MM-dd')
        
        if (thisYearDateStr === dateStr) {
          // Use 🎉 for Birthday, 📅 for others
          const isBirthday = dateObj.name.toLowerCase().includes('birthday')
          events.push({ 
            type: 'important', 
            label: dateObj.name, 
            color: '#c44569',
            emoji: isBirthday ? '🎉' : '📅'
          })
        }
      })
    }

    return events
  }

  // Get list of events for a date (excluding period start/end and reminders which are shown as icons)
  const getEventListForDate = (date) => {
    const events = []
    const dateStr = format(date, 'yyyy-MM-dd')
    
    if (isPlannedPeriodStartDay(date)) {
      events.push({
        type: 'planned-period-start',
        label: 'Planned period start',
        emoji: '🩸'
      })
    }

    // Add 8 days alert (period notification)
    if (data.cycle.expectedNextStart) {
      const nextStart = new Date(data.cycle.expectedNextStart)
      const notificationDate = addDays(nextStart, -PERIOD_NOTIFICATION_DAYS_BEFORE)
      if (isSameDay(date, notificationDate)) {
        events.push({
          type: 'notification',
          label: `${PERIOD_NOTIFICATION_DAYS_BEFORE} Days Before`,
          emoji: '🔔'
        })
      }
    }
    
    // Add important dates reminders (1 month, 1 week, 1 day before, day of)
    if (data.importantDates && data.importantDates.length > 0) {
      const currentYear = date.getFullYear()
      
      data.importantDates.forEach(dateObj => {
        const eventDate = new Date(dateObj.date)
        const eventMonth = eventDate.getMonth()
        const eventDay = eventDate.getDate()
        const thisYearDate = new Date(currentYear, eventMonth, eventDay)
        const isBirthday = dateObj.name.toLowerCase().includes('birthday')
        
        // Check 1 month before
        const monthBefore = addDays(thisYearDate, -30)
        if (isSameDay(date, monthBefore)) {
          events.push({
            type: 'important-reminder',
            label: `${dateObj.name} - 1 month before`,
            emoji: isBirthday ? '🎉' : '📅'
          })
        }
        
        // Check 1 week before
        const weekBefore = addDays(thisYearDate, -7)
        if (isSameDay(date, weekBefore)) {
          events.push({
            type: 'important-reminder',
            label: `${dateObj.name} - 1 week before`,
            emoji: isBirthday ? '🎉' : '📅'
          })
        }
        
        // Check 1 day before
        const dayBefore = addDays(thisYearDate, -1)
        if (isSameDay(date, dayBefore)) {
          events.push({
            type: 'important-reminder',
            label: `${dateObj.name} - 1 day before`,
            emoji: isBirthday ? '🎉' : '📅'
          })
        }
        
        // Check day of
        if (isSameDay(date, thisYearDate)) {
          events.push({
            type: 'important',
            label: dateObj.name,
            emoji: isBirthday ? '🎉' : '📅'
          })
        }
      })
    }

    if (plannedDateNightDates.includes(dateStr)) {
      events.push({
        type: 'planned-date-night',
        label: 'Date night (planned)',
        emoji: '💑'
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
      setMenuAnchor(null)
    } else {
      // Show event menu
      setShowEventMenu(day)
      setMenuAnchor(e.currentTarget)
    }
  }

  // Adjust menu position when it opens
  useEffect(() => {
    if (!showEventMenu || !menuRef.current) return
    
    const adjustMenuPosition = () => {
      const menuElement = menuRef.current
      if (!menuElement) return
      
      // If mobile, simply center fixed
      if (isMobileView) {
        menuElement.classList.add('mobile')
        menuElement.classList.remove('open-upward', 'open-right', 'open-left')
        menuElement.style.left = ''
        menuElement.style.right = ''
        menuElement.style.top = ''
        menuElement.style.transform = ''
        return
      }

      // Desktop positioning relative to anchor
      const anchorElement = menuAnchor
      if (!anchorElement) return
      
      const dayRect = anchorElement.getBoundingClientRect()
      const menuRect = menuElement.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Since menu is now fixed/absolute at root, we calculate position relative to viewport
      // However, to make it "absolute" relative to day, we set top/left based on rects.
      // But if it's inside a relative container... 
      // Let's assume it's rendered in CalendarView which might have relative positioning or we use fixed positioning for desktop too but calculated.
      // Actually, if we render it at root level of component, and component is in flow.
      // Best is to use fixed positioning for the menu so we don't worry about parents, just viewport.
      menuElement.style.position = 'fixed'
      
      const menuHeight = menuRect.height || 400
      const menuWidth = menuRect.width || 300
      
      const spaceBelow = viewportHeight - dayRect.bottom
      const spaceAbove = dayRect.top
      const spaceRight = viewportWidth - dayRect.right
      const spaceLeft = dayRect.left
      
      menuElement.classList.remove('mobile')
      
      // Default: open below, centered horizontally if possible
      let top = dayRect.bottom + 5
      let left = dayRect.left + (dayRect.width / 2) - (menuWidth / 2)
      
      const dayIndex = calendarDays.findIndex(d => isSameDay(d, showEventMenu))
      const column = dayIndex % 7
      const isLeftSide = column <= 2
      const isRightSide = column >= 4
      
      const fitsBelow = spaceBelow >= menuHeight + 20
      const fitsAbove = spaceAbove >= menuHeight + 20
      
      // Determine target class logic without applying immediately
      let targetClass = ''
      
      if (!fitsBelow && !fitsAbove) {
        // Side opening logic if doesn't fit vertically
         if (isLeftSide && spaceRight >= menuWidth + 10) {
            targetClass = 'open-right'
            top = dayRect.top
            left = dayRect.right + 5
         } else if (isRightSide && spaceLeft >= menuWidth + 10) {
            targetClass = 'open-left'
            top = dayRect.top
            left = dayRect.left - menuWidth - 5
         } else if (fitsAbove) {
            targetClass = 'open-upward'
            top = dayRect.top - menuHeight - 5
            left = dayRect.left + (dayRect.width / 2) - (menuWidth / 2)
         }
      } else if (!fitsBelow && fitsAbove) {
         targetClass = 'open-upward'
         top = dayRect.top - menuHeight - 5
      }

      // Only update classes if changed to prevent animation restart
      const currentClasses = Array.from(menuElement.classList)
      const possibleClasses = ['open-upward', 'open-right', 'open-left']
      const classesToRemove = possibleClasses.filter(c => c !== targetClass && currentClasses.includes(c))
      
      if (classesToRemove.length > 0) {
        menuElement.classList.remove(...classesToRemove)
      }
      
      if (targetClass && !currentClasses.includes(targetClass)) {
        menuElement.classList.add(targetClass)
      }

      // Constrain horizontal
      if (left < 10) left = 10
      if (left + menuWidth > viewportWidth - 10) left = viewportWidth - menuWidth - 10

      menuElement.style.top = `${top}px`
      menuElement.style.left = `${left}px`
      
      if (targetClass === 'open-right' || targetClass === 'open-left') {
         menuElement.style.transform = 'none'
      } else {
         // default and open-upward
         left = dayRect.left + (dayRect.width / 2)
         menuElement.style.left = `${left}px`
      }
    }
    
    setTimeout(adjustMenuPosition, 10)
    // Re-adjust on scroll/resize
    window.addEventListener('resize', adjustMenuPosition)
    window.addEventListener('scroll', adjustMenuPosition, true)
    
    return () => {
      window.removeEventListener('resize', adjustMenuPosition)
      window.removeEventListener('scroll', adjustMenuPosition, true)
    }
  }, [showEventMenu, calendarDays, isMobileView, menuAnchor, data])

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!showEventMenu) return
    
    // Disable animations after initial open to prevent blinking on resize
    const animTimer = setTimeout(() => {
      if (menuRef.current) {
        menuRef.current.classList.add('no-anim')
      }
    }, 300)

    const handleClickOutside = (e) => {
      if (!e.target.closest('.event-menu') && !e.target.closest('.calendar-day.selected')) {
        setShowEventMenu(null)
        setMenuAnchor(null)
      }
    }
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowEventMenu(null)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      clearTimeout(animTimer)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
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
    onUpdate(newData)
  }

  const handleAddPeriodStart = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    const periods = data.cycle.periods || []
    
    // Check if this date is already a start date
    if (periods.some(p => p.startDate === dateStr)) {
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
      return
    }
    
    const averageOffset = getAveragePeriodDurationOffset(periods)
    const normalizedOffset = Number.isFinite(averageOffset) ? averageOffset : DEFAULT_PERIOD_DURATION_DAYS

    const sortedByStartDesc = [...periods].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    const mostRecentPeriod = sortedByStartDesc[0]
    if (mostRecentPeriod && mostRecentPeriod.startDate !== dateStr) {
      const recentStart = new Date(mostRecentPeriod.startDate)
      recentStart.setHours(0, 0, 0, 0)
      const diffFromRecent = differenceInDays(newDate, recentStart)
      const isEditableRecent = (!mostRecentPeriod.endDate || mostRecentPeriod.autoEnd)
      if (
        diffFromRecent > 0 &&
        diffFromRecent <= PERIOD_START_SHIFT_TOLERANCE_DAYS &&
        isEditableRecent
      ) {
        const shiftedEndDate = format(addDays(date, normalizedOffset), 'yyyy-MM-dd')
        const newPeriods = periods.map(p => {
          if (p.startDate !== mostRecentPeriod.startDate) {
            return p
          }
          return {
            ...p,
            startDate: dateStr,
            endDate: shiftedEndDate,
            autoEnd: true
          }
        })
        updateCycleData(newPeriods)
        return
      }
    }

    // Add new period with automatic end date based on average actual duration
    const endDate = format(addDays(date, normalizedOffset), 'yyyy-MM-dd')
    const newPeriod = { startDate: dateStr, endDate, autoEnd: true }
    updateCycleData([...periods, newPeriod])
    
    // Don't close menu - keep it open
  }

  const handleAddPeriodEnd = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const periods = data.cycle.periods || []
    
    // Find the most recent period whose start is on or before the selected date
    const sortedPeriods = [...periods].sort((a, b) => 
      new Date(b.startDate) - new Date(a.startDate)
    )
    
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    
    const periodToUpdate = sortedPeriods.find(p => {
      const startDate = new Date(p.startDate)
      startDate.setHours(0, 0, 0, 0)
      return normalizedDate >= startDate
    })
    
    if (periodToUpdate) {
      // Update existing period's end date and clear autoEnd flag if present
      const newPeriods = periods.map(p => {
        if (p.startDate !== periodToUpdate.startDate) {
          return p
        }
        const updatedPeriod = { ...p, endDate: dateStr }
        if (updatedPeriod.autoEnd) {
          const { autoEnd, ...rest } = updatedPeriod
          return rest
        }
        return updatedPeriod
      })
      updateCycleData(newPeriods)
    } else {
      // No period to update, create new period with both start and end
      const newPeriod = { startDate: dateStr, endDate: dateStr }
      updateCycleData([...periods, newPeriod])
    }
    
    // Don't close menu - keep it open
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
    
    // Don't close menu - keep it open
  }

  const getReminderEventsForDate = (date) => {
    const events = []
    const dateStr = format(date, 'yyyy-MM-dd')
    
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

    if (plannedDateNightDates.includes(dateStr)) {
      events.push({
        type: 'planned-date-night',
        reminderType: 'dateNights',
        label: 'Planned date night',
        color: '#74b9ff',
        emoji: '📅'
      })
    }

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
    
    let updatedReminder = {
      ...data.reminders[type],
      lastDone: newLastDone,
      events: [...existingEvents, dateStr].sort().reverse()
    }

    if (type === 'dateNights') {
      const plannedDates = updatedReminder.plannedDates || []
      if (plannedDates.length > 0) {
        const filtered = filterPlannedDatesAfterDate(plannedDates, dateStr)
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
    onUpdate(newData)
  }

  const handlePlanDateNight = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (normalizedDate < today) return
    const reminder = data.reminders.dateNights
    if (!reminder) return
    const updatedReminder = {
      ...reminder,
      plannedDates: addPlannedDateToList(reminder.plannedDates || [], dateStr)
    }
    const newData = updateData({
      reminders: {
        ...data.reminders,
        dateNights: updatedReminder
      }
    })
    onUpdate(newData)
  }

  const handleClearPlannedDateNight = (date) => {
    const reminder = data.reminders.dateNights
    const plannedDates = reminder?.plannedDates || []
    if (!reminder || plannedDates.length === 0) return
    const targetDate = date ? format(date, 'yyyy-MM-dd') : plannedDates[0]
    const updatedReminder = {
      ...reminder,
      plannedDates: removePlannedDateFromList(plannedDates, targetDate)
    }
    const newData = updateData({
      reminders: {
        ...data.reminders,
        dateNights: updatedReminder
      }
    })
    onUpdate(newData)
  }

  return (
    <div className="calendar-view">
      {showEventMenu && (
        <div
          className={`calendar-overlay ${isMobileView ? 'mobile' : ''}`}
          onClick={() => {
            setShowEventMenu(null)
            setMenuAnchor(null)
          }}
        ></div>
      )}
      {showEventMenu && (() => {
        const day = showEventMenu
        const eventList = getEventListForDate(day)
        const periodStart = isPeriodStart(day)
        const periodEnd = isPeriodEnd(day)
        const dateStr = format(day, 'yyyy-MM-dd')
        const isPlannedForDay = plannedDateNightDates.includes(dateStr)
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const isPastDay = dayStart < todayStart
        const showPlanButton = !isPastDay || isPlannedForDay
        
        return (
          <div 
            key={showEventMenu instanceof Date ? showEventMenu.toISOString() : 'menu'}
            ref={menuRef} 
            className="event-menu" 
            onClick={(e) => e.stopPropagation()}
          >
            {eventList.length > 0 && (
              <>
                <div className="menu-section">
                  <div className="menu-section-title">Events</div>
                  <div className="event-list">
                    {eventList.map((event, idx) => (
                      <div key={idx} className="event-list-item">
                        <span className="event-emoji">{event.emoji}</span>
                        <span className="event-label">{event.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="menu-divider"></div>
              </>
            )}
            <div className="menu-section">
              <div className="menu-section-title">Cycle</div>
              <div className="cycle-buttons">
              <button onClick={() => handleAddPeriodStart(day)} className={`cycle-btn ${periodStart ? 'active' : ''}`} title="Mark as Start">
                  Start
                </button>
              <button onClick={() => handleAddPeriodEnd(day)} className={`cycle-btn ${periodEnd ? 'active' : ''}`} title="Mark as End">
                  End
                </button>
                <button onClick={() => handleRemovePeriod(day)} className="cycle-btn remove" title="Remove Period">
                  Remove
                </button>
              </div>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-section">
              <div className="menu-section-title">Reminders</div>
              <div className="reminders-row">
                {[
                  { type: 'flowers', emoji: '🌸', addLabel: 'Give flowers', removeLabel: 'Remove flowers' },
                  { type: 'surprises', emoji: '🎁', addLabel: 'Make a surprise', removeLabel: 'Remove surprise' },
                  { type: 'general', emoji: '💕', addLabel: 'Show love', removeLabel: 'Remove love' },
                  { type: 'dateNights', emoji: '💑', addLabel: 'Date night', removeLabel: 'Remove date night' },
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
                      }}
                      className={`reminder-icon-btn ${hasEvent ? 'remove' : 'add'}`}
                      title={hasEvent ? removeLabel : addLabel}
                    >
                      {emoji}
                    </button>
                  )
                })}
                {showPlanButton && (
                  <>
                    <div className="reminder-plan-divider"></div>
                  <button
                    className={`reminder-icon-btn plan-icon ${isPlannedForDay ? 'active' : ''}`}
                    onClick={() => {
                      if (isPlannedForDay) {
                        handleClearPlannedDateNight(day)
                      } else {
                        handlePlanDateNight(day)
                      }
                    }}
                    title={isPlannedForDay ? 'Remove planned date night' : 'Plan date night'}
                  >
                    💑
                  </button>
                  </>
                )}
              </div>
            </div>
            <button onClick={() => { setShowEventMenu(null); setMenuAnchor(null); }} className="period-btn cancel">
              Cancel
            </button>
          </div>
        )
      })()}
      <div className={mobileTodayClassNames.join(' ')}>
         <TodayReminders data={data} onUpdate={onUpdate} onTotalsChange={handleTodayTotalsChange} />
      </div>
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-header-left">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              ←
            </button>
          </div>
          <div className="calendar-title-wrapper">
            <h2 className="calendar-title">{format(currentDate, 'MMMM yyyy')}</h2>
            {!isSameDay(startOfMonth(currentDate), startOfMonth(new Date())) && (
              <button 
                className="current-month-link"
                onClick={() => setCurrentDate(new Date())}
                title="Go to current month"
              >
                Current month
              </button>
            )}
          </div>
          <div className="calendar-header-right">
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              →
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className={`calendar-days ${numberOfWeeks === 6 ? 'six-weeks' : ''}`}>
            {calendarDays.map(day => {
              const isToday = isSameDay(day, new Date())
              const isCurrentMonth = isSameMonth(day, currentDate)
              const events = getEventsForDate(day)
              const inPastPeriod = checkInPastPeriod(day)
              const periodStart = isPeriodStart(day)
              const inFuturePeriod = !inPastPeriod && checkInFuturePeriod(day)
              const cycleDay = getCycleDayForDate(day)
              const periodEnd = isPeriodEnd(day)
              const dayStr = format(day, 'yyyy-MM-dd')
              const reminderSegmentState = REMINDER_SEGMENT_TYPES.reduce((acc, type) => {
                acc[type] = events.some(event => event.type === type)
                return acc
              }, {})
              const isPlannedForDay = plannedDateNightDates.includes(dayStr)
              const dayStart = new Date(day)
              dayStart.setHours(0, 0, 0, 0)
              const isPastDay = dayStart < todayStart
              const showPlanButton = !isPastDay || isPlannedForDay
              const isFutureDay = dayStart >= todayStart
              const isUpcomingCycleDay = Boolean(
                expectedNextStartDate && isFutureDay && dayStart >= expectedNextStartDate
              )
              const getNormalizedFutureCycleDay = () => {
                if (!expectedNextStartDate) return null
                const cycleLength = data.cycle.cycleLength || 28
                if (cycleLength <= 0) return null
                const offset = differenceInDays(dayStart, expectedNextStartDate)
                if (offset < 0) return null
                const normalized = (offset % cycleLength) + 1
                return normalized
              }
              
              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${showEventMenu && isSameDay(day, showEventMenu) ? 'selected' : ''} ${inPastPeriod ? 'period-past' : ''} ${inFuturePeriod ? 'period-future' : ''} ${periodStart ? 'period-start' : ''} ${periodEnd ? 'period-end' : ''}`}
                  onClick={(e) => handleDayClick(day, e)}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  {(() => {
                    const cycleLength = data.cycle.cycleLength || 28
                    if (cycleLength <= 0) return null
                    const shouldNormalizeCycleDay = inFuturePeriod || isUpcomingCycleDay
                    let displayDay = cycleDay
                    if (shouldNormalizeCycleDay) {
                      const normalized = getNormalizedFutureCycleDay()
                      if (normalized !== null) {
                        displayDay = normalized
                      }
                    }
                    if (displayDay === null || displayDay === undefined) {
                      return null
                    }
                    const phaseDay = Math.min(displayDay, cycleLength)
                    const phase = getPhaseFromCycleDayWithLength(phaseDay, cycleLength)
                    return (
                      <div className="cycle-day-info">
                        <span className="cycle-day-number">{displayDay}</span>
                        {phase && (
                          <span className="cycle-phase-icon">{PHASES[phase].emoji}</span>
                        )}
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
                  <div className={`reminder-indicator ${Object.values(reminderSegmentState).some(Boolean) ? 'active' : ''}`}>
                    {REMINDER_SEGMENT_TYPES.map(type => (
                      <span
                        key={type}
                        className={`reminder-segment ${type} ${reminderSegmentState[type] ? 'active' : ''}`}
                        title={reminderSegmentState[type] ? reminderTypes[type].label : ''}
                      />
                    ))}
                  </div>
                  {isPlannedForDay && (
                    <div className="planned-date-heart" title="Planned date night">
                      ♡
                    </div>
                  )}
                  {/* Notification dot in right bottom corner */}
                  {(() => {
                    let hasNotification = false
                    let notificationTitle = ''
                    
                    // Check for 8 days alert
                    if (data.cycle.expectedNextStart) {
                      const nextStart = new Date(data.cycle.expectedNextStart)
                      const notificationDate = addDays(nextStart, -PERIOD_NOTIFICATION_DAYS_BEFORE)
                      if (isSameDay(day, notificationDate)) {
                        hasNotification = true
                        notificationTitle = `${PERIOD_NOTIFICATION_DAYS_BEFORE} Days Before`
                      }
                    }
                    
                    // Check for Important Dates reminders (1 month, 1 week, 1 day before, day of)
                    if (!hasNotification && data.importantDates && data.importantDates.length > 0) {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const currentYear = day.getFullYear()
                      
                      for (const dateObj of data.importantDates) {
                        const eventDate = new Date(dateObj.date)
                        const eventMonth = eventDate.getMonth()
                        const eventDay = eventDate.getDate()
                        const thisYearDate = new Date(currentYear, eventMonth, eventDay)
                        
                        // Check 1 month before
                        const monthBefore = addDays(thisYearDate, -30)
                        if (isSameDay(day, monthBefore)) {
                          hasNotification = true
                          notificationTitle = `${dateObj.name} - 1 month before`
                          break
                        }
                        
                        // Check 1 week before
                        const weekBefore = addDays(thisYearDate, -7)
                        if (isSameDay(day, weekBefore)) {
                          hasNotification = true
                          notificationTitle = `${dateObj.name} - 1 week before`
                          break
                        }
                        
                        // Check 1 day before
                        const dayBefore = addDays(thisYearDate, -1)
                        if (isSameDay(day, dayBefore)) {
                          hasNotification = true
                          notificationTitle = `${dateObj.name} - 1 day before`
                          break
                        }
                        
                        // Check day of
                        if (isSameDay(day, thisYearDate)) {
                          hasNotification = true
                          notificationTitle = dateObj.name
                          break
                        }
                      }
                    }
                    
                    if (hasNotification) {
                      return (
                        <div 
                          className="notification-dot"
                          title={notificationTitle}
                        ></div>
                      )
                    }
                    return null
                  })()}
                  {/* Event menu rendered at root level */}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={`calendar-sidebar ${hasExpandedSection ? 'has-expanded' : ''}`}>
        <TodayReminders data={data} onUpdate={onUpdate} />
        <CycleTracker data={data} onUpdate={onUpdate} onExpandChange={(expanded) => handleSectionExpand('cycle', expanded)} />
        <ImportantDates data={data} onUpdate={onUpdate} onExpandChange={(expanded) => handleSectionExpand('importantDates', expanded)} />
        <Reminders data={data} onUpdate={onUpdate} onExpandChange={(expanded) => handleSectionExpand('reminders', expanded)} />
      </div>
    </div>
  )
}

export default CalendarView
