// Cycle phase definitions
export const PHASES = {
  'period': { name: 'Moon Days', days: [1, 2, 3, 4, 5], emoji: '🌛' },
  'post-period': { name: 'Fresh Start', days: [6, 7, 8, 9], emoji: '🌱' },
  'ovulation': { name: 'Shining Peak', days: [10, 11, 12, 13, 14, 15], emoji: '✨' },
  'wild-breeze': { name: 'Wild Breeze', days: [16, 17, 18, 19, 20], emoji: '🌬️' },
  'pre-period': { name: 'Wind Down', days: [21, 22, 23, 24, 25, 26, 27, 28], emoji: '🍃' },
}

// Cycle constants
export const DEFAULT_CYCLE_LENGTH = 28
export const DEFAULT_PERIOD_DURATION_DAYS = 4 // 5 days total including start and end
export const MAX_PERIOD_LENGTH_DAYS = 12 // Maximum difference (in days) between period start and end
export const PERIOD_NOTIFICATION_DAYS_BEFORE = 9
export const MAX_CYCLE_LENGTH_DAYS = 50 // Reasonable upper bound for cycle length validation

// Get phase from cycle day using actual cycle length
// Phases are based on fixed day ranges that scale with cycle length
export const getPhaseFromCycleDayWithLength = (cycleDay, cycleLength) => {
  if (!cycleDay || !cycleLength) return null
  
  // Normalize cycle day to 1-cycleLength range
  const normalizedDay = ((cycleDay - 1) % cycleLength) + 1
  
// Calculate phase based on actual day ranges:
// Moon Days: days 1-5 (always)
// Fresh Start: days 6-9 (always)
// Shining Peak: days 10-15 (always)
// Wild Breeze: days 16-20 (always)
// Wind Down: days 21 to end of cycle
  
  if (normalizedDay >= 1 && normalizedDay <= 5) {
    return 'period'
  } else if (normalizedDay >= 6 && normalizedDay <= 9) {
    return 'post-period'
  } else if (normalizedDay >= 10 && normalizedDay <= 15) {
    return 'ovulation'
  } else if (normalizedDay >= 16 && normalizedDay <= 20) {
    return 'wild-breeze'
  } else if (normalizedDay >= 21) {
    return 'pre-period'
  }
  
  return null
}

