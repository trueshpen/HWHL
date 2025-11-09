const STORAGE_KEY = 'wife-happiness-app-data'

const defaultData = {
  cycle: {
    startDate: null,
    endDate: null,
    expectedNextStart: null,
    cycleLength: 28,
  },
  importantDates: [],
  likes: [],
  dislikes: [],
  wishlist: [],
  reminders: {
    flowers: { enabled: true, frequency: 7, lastDone: null },
    surprises: { enabled: true, frequency: 14, lastDone: null },
    dateNights: { enabled: true, frequency: 7, lastDone: null },
    general: { enabled: true, frequency: 1, lastDone: null },
  },
  preferredGifts: [],
}

export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return { ...defaultData, ...data }
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
  return defaultData
}

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

export const updateData = (updates) => {
  const currentData = loadData()
  const newData = { ...currentData, ...updates }
  saveData(newData)
  return newData
}

