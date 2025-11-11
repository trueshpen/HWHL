import { differenceInDays, addDays } from 'date-fns'
import { DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_DURATION_DAYS } from './constants'

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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  return periods.some(period => {
    const start = new Date(period.startDate)
    const end = period.endDate ? new Date(period.endDate) : addDays(start, DEFAULT_PERIOD_DURATION_DAYS)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    
    // Check if date is within the period range AND the period is in the past
    const isInRange = checkDate >= start && checkDate <= end
    const isPast = end < today
    return isInRange && isPast
  })
}

/**
 * Check if a date is within a future expected period
 */
export const isInFuturePeriod = (date, expectedNextStart, cycleLength) => {
  if (!expectedNextStart || !cycleLength) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  // Calculate all future period starts (up to 12 months ahead)
  const futurePeriods = []
  let currentStart = new Date(expectedNextStart)
  const maxDate = addDays(today, 365) // Look up to 1 year ahead
  
  while (currentStart <= maxDate) {
    const periodEnd = addDays(currentStart, DEFAULT_PERIOD_DURATION_DAYS)
    futurePeriods.push({
      start: new Date(currentStart),
      end: periodEnd
    })
    // Move to next cycle
    currentStart = addDays(currentStart, cycleLength)
  }
  
  // Check if date falls within any future period
  return futurePeriods.some(period => {
    period.start.setHours(0, 0, 0, 0)
    period.end.setHours(23, 59, 59, 999)
    return checkDate >= period.start && checkDate <= period.end && period.start > today
  })
}

