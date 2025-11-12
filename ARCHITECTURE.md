# Architecture Documentation

## Overview

Wife Happiness App is a React-based web application built with Vite. It uses a client-server architecture where the frontend (React) communicates with a Node.js/Express backend API for data persistence.

## Project Structure

```
HWHL/
├── src/                    # Frontend React application
│   ├── components/        # React components
│   │   ├── CalendarView.jsx
│   │   ├── CycleTracker.jsx
│   │   ├── ImportantDates.jsx
│   │   ├── NotesView.jsx
│   │   └── Reminders.jsx
│   ├── utils/             # Utility functions
│   │   ├── constants.js
│   │   ├── cycleUtils.js
│   │   └── storage.js
│   ├── App.jsx            # Main app component
│   ├── App.css            # Main app styles
│   ├── index.css          # Global styles
│   └── main.jsx           # Application entry point
├── server/                 # Backend API server
│   └── index.js           # Express server with API endpoints
├── data/                   # Data storage directory
│   └── wife-happiness-data.json  # Persistent data file
├── dist/                   # Production build output
├── public/                 # Static assets
└── scripts/                # Utility scripts
    ├── start-server.bat    # Start development server
    └── test-server.bat     # Test server script
```

## Frontend Architecture

### Component Hierarchy

```
App
├── CalendarView
│   ├── CycleTracker
│   ├── ImportantDates
│   └── Reminders
└── NotesView
```

### Components

#### App.jsx
- **Purpose**: Main application component with view routing
- **State**: Manages current view (calendar/notes)
- **Features**: 
  - View switching between Calendar and Notes
  - Navigation header

#### CalendarView.jsx
- **Purpose**: Main calendar interface with event management
- **State**: 
  - Current month view
  - Application data
  - Event menu visibility
- **Features**:
  - Monthly calendar grid
  - Cycle period visualization
  - Event management (periods, reminders, important dates)
  - Click handlers for day interactions
  - Event menu for adding/removing events
- **Key Functions**:
  - `getEventsForDate()` - Get all events for a specific date
  - `handleAddPeriodStart/End()` - Manage cycle periods
  - `handleAddReminderEvent()` - Add reminder events
  - `updateCycleData()` - Recalculate cycle statistics

#### CycleTracker.jsx
- **Purpose**: Display and manage cycle information
- **Props**: `data`, `onUpdate`
- **Features**:
  - Current cycle day calculation
  - Phase-based suggestions (do/don't items)
  - Cycle statistics (average length, expected next start)
  - Phase-specific suggestion management
- **Key Functions**:
  - `getCurrentCycleDay()` - Calculate current day in cycle
  - `getCurrentPhase()` - Determine current cycle phase
  - `handleAddItem()` - Add phase-specific suggestions

#### ImportantDates.jsx
- **Purpose**: Manage important dates (birthdays, anniversaries)
- **Props**: `data`, `onUpdate`
- **Features**:
  - Add/edit/delete important dates
  - Preferred gifts list per date
  - Automatic notification calculations (1 month, 1 week, 1 day before)
- **Key Functions**:
  - `getNotifications()` - Calculate notification dates
  - `handleSubmit()` - Save date information

#### Reminders.jsx
- **Purpose**: Manage reminder system (flowers, surprises, date nights, general)
- **Props**: `data`, `onUpdate`
- **Features**:
  - Enable/disable reminders
  - Customizable frequency
  - Status tracking (due, pending, ok)
  - Event history tracking
  - Notes for reminders (likes/dislikes, love notes)
- **Key Functions**:
  - `getStatus()` - Calculate reminder status
  - `handleMarkDone()` - Mark reminder as completed
  - `getDaysUntilNext()` - Calculate days until next due date

#### NotesView.jsx
- **Purpose**: Manage likes, dislikes, and wishlist
- **State**: Application data
- **Features**:
  - Likes list (things she loves)
  - Dislikes list (things to avoid)
  - Wishlist with done/undone tracking
- **Key Functions**:
  - `handleAddLike/Dislike()` - Add items to lists
  - `handleToggleWishlistItem()` - Mark wishlist items as done

### Utilities

#### storage.js
- **Purpose**: Data persistence and synchronization
- **Key Functions**:
  - `loadData()` - Async load from server (primary) or localStorage (fallback)
  - `loadDataSync()` - Synchronous load from localStorage
  - `saveData()` - Save to localStorage and sync to server
  - `updateData()` - Update specific data fields
  - `calculateAverageCycleLength()` - Calculate cycle statistics
  - `calculateNextExpectedStart()` - Predict next period start
  - `applyMigrations()` - Migrate old data formats
- **Data Flow**:
  1. Load from server API (primary)
  2. Fallback to localStorage if server unavailable
  3. Save to localStorage immediately
  4. Sync to server in background (debounced)

#### cycleUtils.js
- **Purpose**: Cycle-related calculations
- **Key Functions**:
  - `getCycleDay()` - Calculate cycle day number for a date
  - `isInPastPeriod()` - Check if date is in a past period
  - `isInFuturePeriod()` - Check if date is in expected future period

#### constants.js
- **Purpose**: Application constants and phase definitions
- **Exports**:
  - `PHASES` - Cycle phase definitions (period, post-period, ovulation, pre-period)
  - `DEFAULT_CYCLE_LENGTH` - Default cycle length (28 days)
  - `DEFAULT_PERIOD_DURATION_DAYS` - Default period duration (4 days)
  - `PERIOD_NOTIFICATION_DAYS_BEFORE` - Notification timing (8 days)
  - `getPhaseFromCycleDayWithLength()` - Phase calculation function

## Backend Architecture

### Server (server/index.js)

- **Framework**: Express.js
- **Port**: 3000
- **CORS**: Enabled for local development
- **Data Storage**: JSON file in `data/wife-happiness-data.json`

### API Endpoints

#### GET /api/data
- **Purpose**: Fetch application data
- **Response**: JSON object with all application data
- **Fallback**: Returns default data structure if file doesn't exist

#### POST /api/data
- **Purpose**: Save application data
- **Request Body**: Complete data object
- **Validation**: Checks for valid object structure
- **Response**: Success/error message

#### GET /api/health
- **Purpose**: Health check endpoint
- **Response**: Status and timestamp

### Data Structure

```javascript
{
  cycle: {
    periods: [{ startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }],
    expectedNextStart: 'YYYY-MM-DD',
    cycleLength: 28,
    suggestions: {
      'phase-key': {
        phase: 'Phase Name',
        items: [{ type: 'do'|'dont', text: string, id: string }]
      }
    }
  },
  importantDates: [{
    id: number,
    name: string,
    date: 'YYYY-MM-DD',
    gifts: [string]
  }],
  likes: [{ id: number, text: string }],
  dislikes: [{ id: number, text: string }],
  wishlist: [{ id: number, text: string, done: boolean }],
  reminders: {
    flowers: {
      enabled: boolean,
      frequency: number,
      lastDone: 'ISO string',
      events: ['YYYY-MM-DD'],
      notes: [{ type: 'like'|'dislike', text: string, id: string }]
    },
    surprises: { ... },
    dateNights: { ... },
    general: { ... }
  },
  preferredGifts: []
}
```

## Data Flow

1. **Initial Load**:
   - App loads with `loadDataSync()` from localStorage (fast)
   - `useEffect` triggers async `loadData()` from server
   - Server data overwrites localStorage if available

2. **Data Updates**:
   - User action triggers `updateData()` or direct `saveData()`
   - Data saved to localStorage immediately
   - Background sync to server (debounced 500ms)

3. **Offline Mode**:
   - If server unavailable, app works with localStorage only
   - Data syncs to server when connection restored

## Styling

- **CSS Architecture**: Component-scoped CSS files
- **CSS Variables**: Used for theming (colors, spacing)
- **Responsive Design**: Mobile-friendly layouts

## Technology Stack

- **Frontend**:
  - React 18
  - Vite (build tool)
  - date-fns (date manipulation)
  
- **Backend**:
  - Node.js
  - Express.js
  - CORS middleware

- **Storage**:
  - localStorage (browser)
  - JSON file (server)

## Development Workflow

1. Start server: `npm run server` or `scripts/start-server.bat`
2. Start frontend: `npm run dev`
3. Access app: `http://localhost:5173`
4. API available at: `http://localhost:3000/api`

## Build Process

- **Development**: Vite dev server with hot reload
- **Production**: `npm run build` creates optimized bundle in `dist/`
- **Preview**: `npm run preview` serves production build locally

