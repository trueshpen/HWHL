// Cycle phase definitions
export const PHASES = {
  'period': { name: 'Moon Days', days: [1, 2, 3, 4, 5], emoji: '🌛' },
  'post-period': { name: 'Fresh Start', days: [6, 7, 8, 9, 10, 11, 12, 13], emoji: '🌱' },
  'ovulation': { name: 'Shining Peak', days: [14, 15, 16], emoji: '✨' },
  'pre-period': { name: 'Wind Down', days: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28], emoji: '🍃' },
}

// Cycle constants
export const DEFAULT_CYCLE_LENGTH = 28
export const DEFAULT_PERIOD_DURATION_DAYS = 4 // 5 days total including start and end
export const PERIOD_NOTIFICATION_DAYS_BEFORE = 8
export const MAX_CYCLE_LENGTH_DAYS = 50 // Reasonable upper bound for cycle length validation

// Get phase from cycle day (expects normalized day 1-28)
export const getPhaseFromCycleDay = (cycleDay) => {
  if (!cycleDay) return null
  for (const [phaseKey, phase] of Object.entries(PHASES)) {
    if (phase.days.includes(cycleDay)) {
      return phaseKey
    }
  }
  return null
}

