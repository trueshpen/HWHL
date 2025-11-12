import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000
// Data file is in the parent directory's data folder
const DATA_FILE = path.join(__dirname, '..', 'data', 'wife-happiness-data.json')

// Middleware
app.use(cors())
app.use(express.json())

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Helper function to read data file
const readDataFile = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf8')
      return JSON.parse(fileContent)
    }
  } catch (error) {
    console.error('Error reading data file:', error)
  }
  return null
}

// Helper function to write data file
const writeDataFile = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Error writing data file:', error)
    return false
  }
}

// GET endpoint - fetch data from server
app.get('/api/data', (req, res) => {
  const data = readDataFile()
  if (data) {
    res.json(data)
  } else {
    // Return empty/default data structure if file doesn't exist
    res.json({
      cycle: {
        periods: [],
        expectedNextStart: null,
        cycleLength: 28,
        suggestions: {}
      },
      importantDates: [],
      likes: [],
      dislikes: [],
      wishlist: [],
      reminders: {
        flowers: { enabled: true, frequency: 7, lastDone: null, events: [], notes: [] },
        surprises: { enabled: true, frequency: 2, lastDone: null, events: [] },
        dateNights: { enabled: true, frequency: 7, lastDone: null, events: [] },
        general: { 
          enabled: true, 
          frequency: 1, 
          lastDone: null, 
          events: [], 
          notes: [
            { id: 'general-1', type: 'love', text: 'She is the love of my life' },
            { id: 'general-2', type: 'love', text: 'I must make her happy EVERY DAY' },
            { id: 'general-3', type: 'love', text: 'Support her, take care of her' }
          ] 
        }
      },
      preferredGifts: []
    })
  }
})

// POST endpoint - save data to server
app.post('/api/data', (req, res) => {
  const data = req.body
  
  // Validate that we have the expected data structure
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' })
  }
  
  if (writeDataFile(data)) {
    res.json({ success: true, message: 'Data saved successfully' })
  } else {
    res.status(500).json({ error: 'Failed to save data' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`)
  console.log(`  API Server running on port ${PORT}`)
  console.log(`  Data file: ${DATA_FILE}`)
  console.log(`========================================\n`)
})

