import { differenceInDays, addDays } from 'date-fns'
import { DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_DURATION_DAYS, MAX_PERIOD_LENGTH_DAYS } from './constants'

/**
 * Calculate cycle day number for a given date
 * Day 1 = period start, counts until next period start
 * Works for both past periods and future expected periods
 */
export const getCycleDay = (date, cycleData) => {
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { periods = [], expectedNextStart, cycleLength = DEFAULT_CYCLE_LENGTH } = cycleData
  
  // First check past periods
  if (periods && periods.length > 0) {
    const sortedPeriods = [...periods].sort((a, b) => 
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
  if (checkDate > today && expectedNextStart && cycleLength) {
    let currentStart = new Date(expectedNextStart)
    const maxDate = addDays(today, 365)
    
    while (currentStart <= maxDate) {
      currentStart.setHours(0, 0, 0, 0)
      const nextPeriodStart = addDays(currentStart, cycleLength)
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

/**
 * Check if a date is within a past period
 */
export const isInPastPeriod = (date, periods) => {
  if (!periods || periods.length === 0) return false
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  const fallbackOffset = getAveragePeriodDurationOffset(periods)
  
  return periods.some(period => {
    if (!period.startDate) return false
    const start = new Date(period.startDate)
    const end = period.endDate
      ? new Date(period.endDate)
      : addDays(start, fallbackOffset)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    
    // Treat any recorded period (past or ongoing) as active
    return checkDate >= start && checkDate <= end
  })
}

/**
 * Check if a date is within a future expected period
 */
export const isInFuturePeriod = (
  date,
  expectedNextStart,
  cycleLength,
  periodDurationOffset = DEFAULT_PERIOD_DURATION_DAYS,
  periods = []
) => {
  if (!expectedNextStart || !cycleLength) return false

  const normalizedCycle = Math.max(1, cycleLength)
  const normalizedDuration = Math.max(1, periodDurationOffset)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const earliestPlannableDate = addDays(today, -normalizedDuration)
  if (checkDate < earliestPlannableDate) return false

  const baseStart = new Date(expectedNextStart)
  if (Number.isNaN(baseStart.getTime())) return false
  baseStart.setHours(0, 0, 0, 0)

  const hasRecordedPeriod = Array.isArray(periods) && periods.some(period => {
    if (!period?.startDate) return false
    const start = new Date(period.startDate)
    start.setHours(0, 0, 0, 0)
    const end = period.endDate
      ? new Date(period.endDate)
      : addDays(start, normalizedDuration)
    end.setHours(23, 59, 59, 999)
    return checkDate >= start && checkDate <= end
  })
  if (hasRecordedPeriod) {
    return false
  }

  const nextRecordedStart = Array.isArray(periods)
    ? periods
        .map(period => {
          if (!period?.startDate) return null
          const start = new Date(period.startDate)
          start.setHours(0, 0, 0, 0)
          return start
        })
        .filter(start => start && start > checkDate)
        .sort((a, b) => a - b)[0]
    : null

  if (nextRecordedStart) {
    return false
  }

  const hasPeriodStartOnDate = (targetDate) => {
    if (!Array.isArray(periods) || periods.length === 0) return false
    return periods.some(period => {
      if (!period?.startDate) return false
      const start = new Date(period.startDate)
      start.setHours(0, 0, 0, 0)
      return start.getTime() === targetDate.getTime()
    })
  }

  const isWithinWindow = (startDate) => {
    const windowStart = new Date(startDate)
    windowStart.setHours(0, 0, 0, 0)
    const windowEnd = addDays(new Date(windowStart), normalizedDuration)
    windowEnd.setHours(23, 59, 59, 999)
    return checkDate >= windowStart && checkDate <= windowEnd
  }

  const diffDays = differenceInDays(checkDate, baseStart)
  let cyclesOffset = Math.floor(diffDays / normalizedCycle)
  let candidateStart = addDays(baseStart, cyclesOffset * normalizedCycle)
  candidateStart.setHours(0, 0, 0, 0)

  if (checkDate < candidateStart) {
    candidateStart = addDays(candidateStart, -normalizedCycle)
    candidateStart.setHours(0, 0, 0, 0)
  }

  const candidateHasRecordedStart = hasPeriodStartOnDate(candidateStart)
  if (!candidateHasRecordedStart && isWithinWindow(candidateStart)) {
    return true
  }

  const nextStart = addDays(candidateStart, normalizedCycle)
  nextStart.setHours(0, 0, 0, 0)
  if (!hasPeriodStartOnDate(nextStart) && isWithinWindow(nextStart)) {
    return true
  }

  return false
}

export const getAveragePeriodDurationOffset = (periods) => {
  if (!Array.isArray(periods) || periods.length === 0) {
    return DEFAULT_PERIOD_DURATION_DAYS
  }

  const offsets = periods
    .map(period => {
      if (!period.startDate || !period.endDate || period.autoEnd) {
        return null
      }
      const start = new Date(period.startDate)
      const end = new Date(period.endDate)
      const diff = differenceInDays(end, start)
      if (Number.isNaN(diff) || diff < 0 || diff > MAX_PERIOD_LENGTH_DAYS) {
        return null
      }
      return diff
    })
    .filter((value) => typeof value === 'number')

  if (offsets.length === 0) {
    return DEFAULT_PERIOD_DURATION_DAYS
  }

  const average = offsets.reduce((sum, value) => sum + value, 0) / offsets.length
  const rounded = Math.round(average)
  return Math.max(0, Math.min(rounded, MAX_PERIOD_LENGTH_DAYS))
}

