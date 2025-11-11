const STORAGE_KEY = 'wife-happiness-app-data'
const DATA_FILE_NAME = 'wife-happiness-data.json'

const defaultData = {
  cycle: {
    periods: [], // Array of { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
    expectedNextStart: null,
    cycleLength: 28, // Will be calculated from periods
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
    dateNights: { enabled: true, frequency: 7, lastDone: null, events: [] },
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
  if (!periods || periods.length < 2) return 28 // Default if not enough data
  
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
    if (days > 0 && days < 50) { // Reasonable cycle length
      cycleLengths.push(days)
    }
  }
  
  if (cycleLengths.length === 0) return 28
  
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

// File System Access API for background file saving (no downloads)
let fileHandle = null
let saveTimeout = null

// Check if File System Access API is available
const isFileSystemAccessAvailable = () => {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window
}

// Request file handle from user (one-time permission)
export const requestFileAccess = async () => {
  if (!isFileSystemAccessAvailable()) {
    return false
  }
  
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: DATA_FILE_NAME,
      types: [{
        description: 'JSON files',
        accept: { 'application/json': ['.json'] }
      }]
    })
    
    // Save the file handle permission in localStorage
    // Note: We can't store the file handle itself, but we can remember that permission was granted
    localStorage.setItem('file-access-granted', 'true')
    
    // Save current data to the file
    const data = loadData()
    await saveToFile(data)
    
    return true
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error requesting file access:', error)
    }
    return false
  }
}

// Save data to file using File System Access API (background, no download)
const saveToFile = async (data) => {
  if (!fileHandle) {
    return false
  }
  
  try {
    const json = JSON.stringify(data, null, 2)
    const writable = await fileHandle.createWritable()
    await writable.write(json)
    await writable.close()
    return true
  } catch (error) {
    console.error('Error saving to file:', error)
    // If file handle is invalid, clear it
    if (error.name === 'NotFoundError' || error.name === 'InvalidStateError') {
      fileHandle = null
      localStorage.removeItem('file-access-granted')
    }
    return false
  }
}

// Auto-save to file in background (debounced)
const autoSaveToFile = (data) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  // Wait 1 second after last change before auto-saving
  saveTimeout = setTimeout(async () => {
    if (fileHandle && isFileSystemAccessAvailable()) {
      await saveToFile(data)
    }
  }, 1000)
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
        ] : []) // Add notes array if missing, with defaults for general
      }
      // Migrate old default frequency for surprises
      if (type === 'surprises' && oldReminders[type].frequency === 14) {
        migrated[type].frequency = 2
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
    cycleLength: oldCycle.cycleLength || 28
  }
}

// Load data from localStorage (temporary storage)
export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
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
  } catch (error) {
    console.error('Error loading data:', error)
  }
  return defaultData
}

// Save data to localStorage and optionally to file
export const saveData = (data) => {
  try {
    // Always save to localStorage (persistent storage)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    
    // If file access is available and permission was granted, save to file in background
    if (isFileSystemAccessAvailable() && fileHandle) {
      autoSaveToFile(data)
    }
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

// Initialize file access if previously granted
// Note: File handles can't be persisted, but we remember that permission was granted
export const initializeFileAccess = async () => {
  if (isFileSystemAccessAvailable() && localStorage.getItem('file-access-granted') === 'true') {
    // Permission was granted before, but file handle is lost on page reload
    // User will need to click "Enable File Save" again to re-establish the file handle
    // The browser will remember the file location from previous session
    return true
  }
  return false
}

// Re-establish file handle (for when page reloads but permission was previously granted)
// Note: This requires user interaction, so we'll just return false and let user click the button
export const restoreFileAccess = async () => {
  // File handles can't be persisted across page reloads
  // User will need to click "Enable File Save" again to re-establish the file handle
  // The browser will remember the file location from previous session
  return false
}

export const updateData = (updates) => {
  const currentData = loadData()
  const newData = { ...currentData, ...updates }
  saveData(newData)
  return newData
}

// Optional: Export/Import functions for backup (save to PC file)
export const exportData = () => {
  try {
    const data = loadData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wife-happiness-data.json'
    
    // Ensure element is in DOM before clicking (Chrome requirement)
    document.body.appendChild(a)
    a.click()
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error('Error exporting data:', error)
    alert('Error exporting data. Please try again.')
  }
}

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        saveData(data)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid file format'))
      }
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

// Load data from local JSON file (for development/backup)
export const loadDataFromFile = async () => {
  try {
    // Try to load from the data directory
    const response = await fetch('/data/wife-happiness-data.json')
    if (response.ok) {
      const data = await response.json()
      // Save to localStorage
      saveData(data)
      return data
    }
  } catch (error) {
    console.log('Could not load data from file, using localStorage:', error)
  }
  return null
}

// Clear all data (reset to default)
export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return defaultData
  } catch (error) {
    console.error('Error clearing data:', error)
    return defaultData
  }
}

