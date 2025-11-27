import express from 'express'
import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import selfsigned from 'selfsigned'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000
// Data file is in the parent directory's data folder
const DATA_FILE = path.join(__dirname, '..', 'data', 'wife-happiness-data.json')
const CERT_DIR = path.join(__dirname, '..', 'cert')
const KEY_PATH = path.join(CERT_DIR, 'local-key.pem')
const CERT_PATH = path.join(CERT_DIR, 'local-cert.pem')

// Middleware
app.use(express.json())

app.use((req, res, next) => {
  const origin = req.headers.origin || '*'
  res.header('Access-Control-Allow-Origin', origin)
  res.header('Vary', 'Origin')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  const requestedHeaders = req.headers['access-control-request-headers']
  if (requestedHeaders) {
    res.header('Access-Control-Allow-Headers', requestedHeaders)
  } else {
    res.header('Access-Control-Allow-Headers', 'Content-Type')
  }
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', '86400')

  if (req.headers['access-control-request-private-network']) {
    res.header('Access-Control-Allow-Private-Network', 'true')
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

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
      giftIdeas: [],
      reminders: {
        flowers: { enabled: true, frequency: 7, lastDone: null, events: [], notes: [] },
        surprises: { enabled: true, frequency: 2, lastDone: null, events: [] },
        dateNights: { enabled: true, frequency: 7, lastDone: null, events: [], plannedDates: [] },
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
      }
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

const CERT_ATTRIBUTES = [{ name: 'commonName', value: 'localhost' }]
const CERT_OPTIONS = {
  algorithm: 'sha256',
  days: 825,
  keySize: 2048,
  extensions: [
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' }
      ]
    }
  ]
}

const ensureCertificates = () => {
  try {
    const hasKey = fs.existsSync(KEY_PATH)
    const hasCert = fs.existsSync(CERT_PATH)

    if (!hasKey || !hasCert) {
      console.warn('\n⚠️  HTTPS certificates not found. Generating new self-signed certificates...')
      fs.mkdirSync(CERT_DIR, { recursive: true })
      const pems = selfsigned.generate(CERT_ATTRIBUTES, CERT_OPTIONS)
      fs.writeFileSync(KEY_PATH, pems.private, { encoding: 'utf-8' })
      fs.writeFileSync(CERT_PATH, pems.cert, { encoding: 'utf-8' })
      console.warn(`Certificates saved to:\n  Key : ${KEY_PATH}\n  Cert: ${CERT_PATH}\n`)
    }

    return {
      key: fs.readFileSync(KEY_PATH),
      cert: fs.readFileSync(CERT_PATH)
    }
  } catch (error) {
    console.error('\n❌ Failed to prepare HTTPS certificates:', error)
    return null
  }
}

const credentials = ensureCertificates()

if (credentials) {
  https.createServer(credentials, app).listen(PORT, () => {
    console.log(`\n========================================`)
    console.log(`  HTTPS API Server running on https://localhost:${PORT}`)
    console.log(`  Data file: ${DATA_FILE}`)
    console.log(`  Cert dir : ${CERT_DIR}`)
    console.log(`========================================\n`)
  })
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`\n========================================`)
    console.log(`  HTTP API Server running on http://localhost:${PORT}`)
    console.log(`  Data file: ${DATA_FILE}`)
    console.log(`  (HTTPS certificate generation failed, running HTTP fallback)`)
    console.log(`========================================\n`)
  })
}

