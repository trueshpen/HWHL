import { DEFAULT_CYCLE_LENGTH, MAX_CYCLE_LENGTH_DAYS } from './constants'

const STORAGE_KEY = 'wife-happiness-app-data'
const API_BASE_URL = 'http://localhost:3000/api'

const defaultData = {
  cycle: {
    periods: [], // Array of { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
    expectedNextStart: null,
    cycleLength: DEFAULT_CYCLE_LENGTH, // Will be calculated from periods
    suggestions: {
      // Phase-based suggestions: { phase: string, items: [{ type: 'do'|'dont', text: string, id: string }] }
      // Phases: 'period', 'post-period', 'ovulation', 'pre-period'
    }
  },
  importantDates: [],
  likes: [],
  dislikes: [],
  wishlist: [],
  reminders: {
    flowers: { 
      enabled: true, 
      frequency: 7, 
      lastDone: null, 
      events: [],
      notes: [] // Array of { type: 'like'|'dislike', text: string, id: string }
    },
    surprises: { enabled: true, frequency: 2, lastDone: null, events: [] },
    dateNights: { enabled: true, frequency: 7, lastDone: null, events: [], notes: [], plannedDate: null },
    general: { enabled: true, frequency: 1, lastDone: null, events: [], notes: [
      { id: 'general-1', type: 'love', text: 'She is the love of my life' },
      { id: 'general-2', type: 'love', text: 'I must make her happy EVERY DAY' },
      { id: 'general-3', type: 'love', text: 'Support her, take care of her' }
    ] },
  },
  preferredGifts: [],
}

// Calculate average cycle length from periods
export const calculateAverageCycleLength = (periods) => {
  if (!periods || periods.length < 2) return DEFAULT_CYCLE_LENGTH // Default if not enough data
  
  // Sort periods by start date
  const sorted = [...periods].sort((a, b) => 
    new Date(a.startDate) - new Date(b.startDate)
  )
  
  // Calculate differences between consecutive start dates
  const cycleLengths = []
  for (let i = 1; i < sorted.length; i++) {
    const days = Math.round(
      (new Date(sorted[i].startDate) - new Date(sorted[i-1].startDate)) / (1000 * 60 * 60 * 24)
    )
    if (days > 0 && days < MAX_CYCLE_LENGTH_DAYS) { // Reasonable cycle length
      cycleLengths.push(days)
    }
  }
  
  if (cycleLengths.length === 0) return DEFAULT_CYCLE_LENGTH
  
  // Return average
  const sum = cycleLengths.reduce((a, b) => a + b, 0)
  return Math.round(sum / cycleLengths.length)
}

// Calculate next expected period start date
export const calculateNextExpectedStart = (periods, cycleLength) => {
  if (!periods || periods.length === 0) return null
  
  // Get the most recent period start date
  const sorted = [...periods].sort((a, b) => 
    new Date(b.startDate) - new Date(a.startDate)
  )
  const lastStart = new Date(sorted[0].startDate)
  
  // Add average cycle length
  const nextStart = new Date(lastStart)
  nextStart.setDate(nextStart.getDate() + cycleLength)
  
  return nextStart.toISOString().split('T')[0]
}

// Migrate old reminder format to include events array and notes
const migrateReminderData = (oldReminders) => {
  if (!oldReminders) return defaultData.reminders
  
  const migrated = { ...defaultData.reminders }
  Object.keys(migrated).forEach(type => {
    if (oldReminders[type]) {
      migrated[type] = {
        ...oldReminders[type],
        events: oldReminders[type].events || [],
        notes: oldReminders[type].notes || (type === 'general' ? [
          { id: 'general-1', type: 'love', text: 'She is the love of my life' },
          { id: 'general-2', type: 'love', text: 'I must make her happy EVERY DAY' },
          { id: 'general-3', type: 'love', text: 'Support her, take care of her' }
        ] : []), // Add notes array if missing, with defaults for general
        plannedDate: oldReminders[type].plannedDate || null
      }
      // Migrate old default frequency for surprises
      if (type === 'surprises' && oldReminders[type].frequency === 14) {
        migrated[type].frequency = 2
      }
      // Ensure dateNights has notes array
      if (type === 'dateNights' && !migrated[type].notes) {
        migrated[type].notes = []
      }
    }
  })
  
  return migrated
}

// Migrate old data format to new periods format
const migrateCycleData = (oldCycle) => {
  if (!oldCycle) return defaultData.cycle
  
  // If already has periods array, preserve all data and return as is
  if (oldCycle.periods && Array.isArray(oldCycle.periods)) {
    return {
      ...defaultData.cycle,
      ...oldCycle,
      periods: oldCycle.periods // Explicitly preserve periods array
    }
  }
  
  // Migrate from old format (startDate/endDate) to new format (periods array)
  const periods = []
  if (oldCycle.startDate) {
    periods.push({
      startDate: oldCycle.startDate,
      endDate: oldCycle.endDate || null
    })
  }
  
  return {
    ...defaultData.cycle,
    ...oldCycle,
    periods, // Use migrated periods
    expectedNextStart: oldCycle.expectedNextStart || null,
    cycleLength: oldCycle.cycleLength || DEFAULT_CYCLE_LENGTH
  }
}

// Apply migrations to data
const applyMigrations = (data) => {
  const merged = { ...defaultData, ...data }
  
  // Migrate cycle data if needed
  if (data.cycle) {
    // Migration function now preserves existing periods array
    merged.cycle = migrateCycleData(data.cycle)
    
    // Add suggestions if missing
    if (!merged.cycle.suggestions) {
      merged.cycle.suggestions = defaultData.cycle.suggestions
    }
    
    // Migrate old '8-days-before' phase to 'pre-period' if it exists
    if (merged.cycle.suggestions['8-days-before']) {
      if (!merged.cycle.suggestions['pre-period']) {
        merged.cycle.suggestions['pre-period'] = {
          phase: 'Wind Down',
          items: merged.cycle.suggestions['8-days-before'].items || []
        }
      } else {
        // Merge items if pre-period already exists
        merged.cycle.suggestions['pre-period'].items = [
          ...merged.cycle.suggestions['pre-period'].items,
          ...(merged.cycle.suggestions['8-days-before'].items || [])
        ]
      }
      delete merged.cycle.suggestions['8-days-before']
    }
    
    // Recalculate if we have periods
    if (merged.cycle.periods && merged.cycle.periods.length > 0) {
      merged.cycle.cycleLength = calculateAverageCycleLength(merged.cycle.periods)
      merged.cycle.expectedNextStart = calculateNextExpectedStart(
        merged.cycle.periods, 
        merged.cycle.cycleLength
      )
    }
  }
  
  // Migrate reminder data if needed
  if (data.reminders) {
    merged.reminders = migrateReminderData(data.reminders)
  }
  
  return merged
}

// Sync data to server (save to PC)
let saveTimeout = null
const syncToServer = async (data) => {
  // Debounce: wait 500ms after last change before syncing
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  saveTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        console.error('Failed to sync data to server')
      }
    } catch (error) {
      // Silently fail if server is not available (offline mode)
      // Data is still saved to localStorage
      console.warn('Server sync failed (server may be offline):', error.message)
    }
  }, 500)
}

// Load data from server (primary source) or localStorage (fallback)
export const loadData = async () => {
  try {
    // Try to fetch from server first
    const response = await fetch(`${API_BASE_URL}/data`)
    if (response.ok) {
      const serverData = await response.json()
      const migrated = applyMigrations(serverData)
      
      // Also save to localStorage for offline access
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      
      return migrated
    }
  } catch (error) {
    // Server not available, fallback to localStorage
    console.warn('Server not available, using localStorage:', error.message)
  }
  
  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return applyMigrations(data)
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error)
  }
  
  return defaultData
}

// Synchronous version for initial load (before async load completes)
export const loadDataSync = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return applyMigrations(data)
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
  return defaultData
}

// Save data to localStorage and sync to server
export const saveData = (data) => {
  try {
    // Always save to localStorage immediately (for fast UI updates)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    
    // Sync to server in background (saves to PC)
    syncToServer(data)
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

export const updateData = (updates) => {
  const currentData = loadDataSync()
  const newData = { ...currentData, ...updates }
  saveData(newData)
  return newData
}
