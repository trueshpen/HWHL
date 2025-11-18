# API Documentation

## Overview

The Wife Happiness App uses a RESTful API built with Express.js. The API provides endpoints for data persistence, allowing the frontend to save and retrieve application data.

## Base URL

```
https://localhost:3000/api
```

**Note**: The API server uses HTTPS with self-signed certificates. You may need to accept the certificate warning in your browser or trust the certificate locally.

## Endpoints

### GET /api/data

Fetches all application data from the server.

**Request:**
```http
GET /api/data
```

**Response:**
- **Status**: 200 OK
- **Content-Type**: application/json
- **Body**: Complete application data object

**Example Response:**
```json
{
  "cycle": {
    "periods": [
      {
        "startDate": "2024-01-15",
        "endDate": "2024-01-19"
      }
    ],
    "expectedNextStart": "2024-02-12",
    "cycleLength": 28,
    "suggestions": {}
  },
  "importantDates": [],
  "likes": [],
  "dislikes": [],
  "wishlist": [],
  "reminders": {
    "flowers": {
      "enabled": true,
      "frequency": 7,
      "lastDone": null,
      "events": [],
      "notes": []
    },
    "surprises": {
      "enabled": true,
      "frequency": 2,
      "lastDone": null,
      "events": []
    },
    "dateNights": {
      "enabled": true,
      "frequency": 7,
      "lastDone": null,
      "events": [],
      "notes": []
    },
    "general": {
      "enabled": true,
      "frequency": 1,
      "lastDone": null,
      "events": [],
      "notes": [
        {
          "id": "general-1",
          "type": "love",
          "text": "She is the love of my life"
        }
      ]
    }
  },
  "preferredGifts": []
}
```

**Fallback Behavior:**
If the data file doesn't exist, the server returns a default data structure with empty arrays and default values.

**Error Handling:**
- If file read fails, returns default data structure
- Server errors are logged but don't crash the server

---

### POST /api/data

Saves application data to the server.

**Request:**
```http
POST /api/data
Content-Type: application/json
```

**Request Body:**
Complete application data object (same structure as GET response).

**Example Request:**
```json
{
  "cycle": {
    "periods": [
      {
        "startDate": "2024-01-15",
        "endDate": "2024-01-19"
      }
    ],
    "expectedNextStart": "2024-02-12",
    "cycleLength": 28,
    "suggestions": {}
  },
  "importantDates": [
    {
      "id": 1234567890,
      "name": "Birthday",
      "date": "2024-05-20",
      "gifts": ["Flowers", "Chocolate"]
    }
  ],
  "likes": [
    {
      "id": 1234567891,
      "text": "Coffee in the morning"
    }
  ],
  "dislikes": [],
  "wishlist": [],
  "reminders": { ... },
  "preferredGifts": []
}
```

**Response:**
- **Status**: 200 OK (success) or 400 Bad Request (invalid data) or 500 Internal Server Error (save failed)
- **Content-Type**: application/json

**Success Response:**
```json
{
  "success": true,
  "message": "Data saved successfully"
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "error": "Invalid data format"
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to save data"
}
```

**Validation:**
- Request body must be a valid object
- Server validates data structure before saving

**Error Handling:**
- Invalid data format returns 400
- File write errors return 500
- Errors are logged to console

---

### GET /api/health

Health check endpoint to verify server is running.

**Request:**
```http
GET /api/health
```

**Response:**
- **Status**: 200 OK
- **Content-Type**: application/json

**Example Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Use Case:**
Useful for monitoring and testing server availability.

---

## Data File Location

The server stores data in:
```
data/wife-happiness-data.json
```

The server automatically creates the `data/` directory if it doesn't exist.

## CORS Configuration

The API has CORS enabled to allow requests from the frontend development server (typically `http://localhost:5173`). The server uses HTTPS for secure communication.

## Error Handling

### Client-Side Error Handling

The frontend handles API errors gracefully:

1. **Server Unavailable**: Falls back to localStorage
2. **Network Errors**: Logs warning, continues with localStorage
3. **Invalid Responses**: Uses default data structure

### Server-Side Error Handling

- File read errors: Returns default data
- File write errors: Returns 500 error
- Invalid requests: Returns 400 error
- All errors are logged to console

## Rate Limiting

Currently, there is no rate limiting implemented. The frontend uses debouncing (500ms) to prevent excessive API calls.

## Data Synchronization

The frontend implements a dual-storage strategy:

1. **Primary**: Server API (`/api/data`)
2. **Fallback**: Browser localStorage

**Sync Flow:**
1. Load from server on app start
2. Save to localStorage immediately on changes
3. Sync to server in background (debounced)

This ensures:
- Fast UI updates (localStorage)
- Data persistence (server file)
- Offline capability (localStorage fallback)

## Security Considerations

⚠️ **Current Implementation**: The API has no authentication or authorization. It's designed for local use only.

**For Production:**
- Add authentication (JWT, session-based)
- Implement rate limiting
- Add input validation and sanitization
- Use HTTPS
- Add request logging and monitoring

## Testing

### Manual Testing

1. **Start Server**: `npm run server` or `scripts/start-server.bat` (requires SSL certificates - run `npm run generate-cert` first)
2. **Test GET**: `curl -k https://localhost:3000/api/data` (use `-k` flag to ignore self-signed certificate)
3. **Test POST**: 
   ```bash
   curl -k -X POST https://localhost:3000/api/data \
     -H "Content-Type: application/json" \
     -d @data/wife-happiness-data.json
   ```
4. **Test Health**: `curl -k https://localhost:3000/api/health`

### Using Browser DevTools

1. Open browser console (F12)
2. Test GET:
   ```javascript
   fetch('https://localhost:3000/api/data')
     .then(r => r.json())
     .then(console.log)
   ```
3. Test POST:
   ```javascript
   fetch('https://localhost:3000/api/data', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ /* your data */ })
   })
     .then(r => r.json())
     .then(console.log)
   ```

## Future Enhancements

- [ ] Add authentication endpoints
- [ ] Implement data versioning
- [ ] Add backup/restore endpoints
- [ ] Add data export/import endpoints
- [ ] Implement WebSocket for real-time sync
- [ ] Add request validation middleware
- [ ] Add logging and monitoring

