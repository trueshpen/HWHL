# Architecture Documentation

## Overview

Wife Happiness App is a React-based web application built with Vite. It uses a client-server architecture where the frontend (React) communicates with a Node.js/Express backend API for data persistence.

## Project Structure

```
HWHL/
├── src/                    # Frontend React application
│   ├── components/        # React components
│   │   ├── CalendarView.jsx
│   │   ├── CalendarView.css
│   │   ├── CycleTracker.jsx
│   │   ├── CycleTracker.css
│   │   ├── ImportantDates.jsx
│   │   ├── ImportantDates.css
│   │   ├── NotesView.jsx
│   │   ├── NotesView.css
│   │   ├── PasswordProtection.jsx
│   │   ├── PasswordProtection.css
│   │   ├── PersonalizationView.jsx
│   │   ├── PersonalizationView.css
│   │   ├── Reminders.jsx
│   │   ├── Reminders.css
│   │   ├── TagList.jsx
│   │   ├── TagList.css
│   │   ├── TodayReminders.jsx
│   │   └── TodayReminders.css
│   ├── utils/             # Utility functions
│   │   ├── constants.js
│   │   ├── cycleUtils.js
│   │   ├── notifications.js
│   │   ├── reminderUtils.js
│   │   └── storage.js
│   ├── App.jsx            # Main app component
│   ├── App.css            # Main app styles
│   ├── index.css          # Global styles
│   └── main.jsx           # Application entry point
├── server/                 # Backend API server
│   └── index.js           # Express server with API endpoints
├── data/                   # Data storage directory
│   └── wife-happiness-data.json  # Persistent data file
├── cert/                   # SSL certificates directory
│   ├── local-key.pem       # Private key for HTTPS
│   └── local-cert.pem      # Certificate for HTTPS
├── dist/                   # Production build output
├── public/                 # Static assets
│   └── icons/              # App icons for notifications
│       ├── icon-192.png
│       └── icon-512.png
├── scripts/                # Utility scripts
│   ├── start-server.bat    # Start development server
│   ├── test-server.bat     # Test server script
│   └── generate-cert.mjs   # Generate SSL certificates
└── vite.config.js          # Vite configuration
```

## Frontend Architecture

### Component Hierarchy

```
App
├── PasswordProtection
├── CalendarView
│   ├── CycleTracker
│   ├── ImportantDates
│   ├── Reminders
│   └── TodayReminders
├── PersonalizationView
│   ├── Reminders
│   │   └── TagList
│   ├── CycleTracker
│   └── ImportantDates
└── NotesView
    └── TagList
```

### Components

#### App.jsx
- **Purpose**: Main application component with view routing
- **State**: Manages current view (calendar/personalization/notes), application data, authentication state, backup status, notification status, and settings menu visibility
- **Features**: 
  - Password protection (PasswordProtection component)
  - View switching between Calendar, Personalization, and Notes
  - Desktop navigation (Calendar, Notes)
  - Mobile bottom navigation (Calendar, Personalization, Notes)
  - Settings dropdown menu with export/import, notifications, and logout
  - Data synchronization with server
  - Daily notification scheduling
  - Test notification functionality
  - Data export/import functionality
  - Logout functionality
  - Status messages for backup and notifications
  - Click outside handler for settings menu
- **Key Functions**:
  - `renderContent()` - Render appropriate view based on currentView state
  - `onUpdateData()` - Update application data state
  - `handleTestNotification()` - Test and enable browser notifications
  - `handleLogout()` - Log out and reset authentication
  - `handleExportData()` - Export data to JSON file
  - `handleImportData()` - Import data from JSON file
  - `handleImportClick()` - Trigger file input for import

#### PasswordProtection.jsx
- **Purpose**: Password protection screen for app access
- **Props**: `onAuthenticated` (callback when password is correct)
- **Features**:
  - Password input form
  - Session-based authentication (stored in sessionStorage)
  - Prevents access to app until correct password is entered
  - Returns null when authenticated (hides itself)
- **Key Functions**:
  - `handleSubmit()` - Validate password and authenticate

#### CalendarView.jsx
- **Purpose**: Main calendar interface with event management
- **Props**: `data`, `onUpdate`
- **State**: 
  - `currentDate` - Current month view
  - `showEventMenu` - Event menu visibility (date for which to show menu)
  - `menuAnchor` - Element that triggered the menu
  - `expandedSections` - Expanded sections state (cycle, importantDates, reminders)
  - `isMobileView` - Mobile view detection
  - `todayTotals` - Count of today's reminders/events
  - `todayCardPosition` - Position of today's card ('top' or 'bottom')
- **Refs**:
  - `menuRef` - Reference for dynamic menu positioning
  - `todayCountRef` - Reference for tracking today's count
  - `todaySlideTimeoutRef` - Reference for slide animation timeout
- **Features**:
  - Monthly calendar grid showing full weeks (includes days from previous/next month)
  - Cycle period visualization
  - Event management (periods, reminders, important dates, planned date nights)
  - Click handlers for day interactions
  - Event menu for adding/removing events with smart positioning
  - Planned date night functionality
  - Sidebar expand/collapse tracking
  - Dynamic menu positioning based on viewport
- **Key Functions**:
  - `getEventsForDate()` - Get all events for a specific date
  - `handleAddPeriodStart/End()` - Manage cycle periods
  - `handleAddReminderEvent()` - Add reminder events
  - `handleRemoveReminderEvent()` - Remove reminder events
  - `handlePlanDateNight()` - Plan date night for specific date
  - `handleClearPlannedDateNight()` - Clear planned date night
  - `isPlannedPeriodStartDay()` - Check if date is planned period start
  - `updateCycleData()` - Recalculate cycle statistics
  - `isPeriodStart/End()` - Check if date is period start/end
  - `handleSectionExpand()` - Track expand/collapse state of sidebar sections
  - `adjustMenuPosition()` - Dynamically position event menu based on viewport
- **Helper Functions**:
  - `addPlannedDateToList()` - Add planned date to list (sorted, no duplicates)
  - `filterPlannedDatesAfterDate()` - Filter planned dates after a cutoff date
  - `removePlannedDateFromList()` - Remove planned date from list
- **Constants**:
  - `REMINDER_SEGMENT_TYPES` - Array of reminder types for calendar segments: ['flowers', 'surprises', 'general', 'dateNights']

#### CycleTracker.jsx
- **Purpose**: Display and manage cycle information
- **Props**: `data`, `onUpdate`, `onExpandChange` (optional callback for expand/collapse state)
- **Features**:
  - Current cycle day calculation
  - Phase-based suggestions (do/don't items)
  - Cycle statistics (average length, expected next start)
  - Phase-specific suggestion management
  - Expand/collapse functionality with state tracking
- **Key Functions**:
  - `getCurrentCycleDay()` - Calculate current day in cycle
  - `getCurrentPhase()` - Determine current cycle phase
  - `handleAddItem()` - Add phase-specific suggestions
  - `handleExpandChange()` - Handle expand/collapse state changes

#### ImportantDates.jsx
- **Purpose**: Manage important dates (birthdays, anniversaries)
- **Props**: `data`, `onUpdate`, `onExpandChange` (optional callback for expand/collapse state)
- **Features**:
  - Add/edit/delete important dates
  - Notes field per date (textarea, supports multiline text)
  - Backward compatibility: supports both array and string format for notes/gifts
  - Automatic notification calculations (1 month, 1 week, 1 day before)
  - Keyboard shortcuts: Escape to cancel, Shift/Ctrl+Enter to submit
  - Expand/collapse functionality with state tracking
- **Key Functions**:
  - `handleSubmit()` - Save date information
  - `handleEdit()` - Load date data for editing (handles both formats)
  - `handleCancel()` - Cancel editing with Escape key support
  - `handleExpandChange()` - Handle expand/collapse state changes

#### Reminders.jsx
- **Purpose**: Manage reminder system (flowers, surprises, date nights, general)
- **Props**: `data`, `onUpdate`, `onExpandChange` (optional callback for expand/collapse state)
- **State**: Editing state, notes editing, planning state, planned date input, expanded state
- **Features**:
  - Enable/disable reminders
  - Customizable frequency
  - Status tracking (due, pending, ok, planned, planned-today, planned-overdue)
  - Event history tracking
  - Notes for reminders (likes/dislikes, love notes) - uses TagList component
  - Expand/collapse functionality with state tracking
  - **Planned date night functionality** (for dateNights type):
    - Plan specific date nights in advance
    - Date input for planning
    - Clear planned dates
    - Automatic clearing when date night is completed
- **Key Functions**:
  - `getStatus()` - Calculate reminder status (includes planned date logic)
  - `handleMarkDone()` - Mark reminder as completed (clears planned date if applicable)
  - `handlePlanDateNight()` - Set planned date for date night
  - `handleClearPlannedDate()` - Clear planned date
  - `handleStartPlanning()` - Initialize planning mode
  - `handleCancelPlanning()` - Cancel planning mode
  - `handleAddNoteDirectly()` - Add note to reminder
  - `handleUpdateNoteText()` - Update note text
  - `handleRemoveNote()` - Remove note from reminder
  - `handleExpandChange()` - Handle expand/collapse state changes

#### NotesView.jsx
- **Purpose**: Manage likes, dislikes, wishlist, and gift ideas
- **Props**: `data`, `onUpdate`
- **State**: Application data, newWishlistItem, newGiftIdea
- **Features**:
  - Likes list (things she loves) - uses TagList component
  - Dislikes list (things to avoid) - uses TagList component
  - Wishlist with done/undone tracking
  - Gift ideas list with done/undone tracking
- **Key Functions**:
  - `handleAddLike()` - Add item to likes list
  - `handleAddDislike()` - Add item to dislikes list
  - `handleUpdateLike()` - Update item in likes list
  - `handleUpdateDislike()` - Update item in dislikes list
  - `handleDeleteLike()` - Delete item from likes list
  - `handleDeleteDislike()` - Delete item from dislikes list
  - `handleAddWishlistItem()` - Add item to wishlist
  - `handleDeleteWishlistItem()` - Delete item from wishlist
  - `handleToggleWishlistItem()` - Toggle done/undone status of wishlist item
  - `handleAddGiftIdea()` - Add item to gift ideas list
  - `handleDeleteGiftIdea()` - Delete item from gift ideas list
  - `handleToggleGiftIdea()` - Toggle done/undone status of gift idea

#### TagList.jsx
- **Purpose**: Reusable component for managing tag-like lists (likes, dislikes, notes)
- **Props**: 
  - `items` - Array of items with `{ id, text, type }` structure
  - `onAdd` - Callback when new item is added `(text, type) => void`
  - `onUpdate` - Callback when item is updated `(id, text) => void`
  - `onDelete` - Callback when item is deleted `(id) => void`
  - `placeholder` - Placeholder text for add input (default: "Add item...")
  - `defaultType` - Default type for new items (default: "like")
  - `allowTypeSelection` - Whether to show type selector (default: true)
- **State**: `editingTagId`, `editText`, `isAdding`, `newTagText`, `newTagType`
- **Features**:
  - Click on tag text to start editing inline
  - Edit tag text inline with auto-focus and text selection
  - Delete tags with remove button (×)
  - Add new tags with type selection (like/dislike)
  - Keyboard shortcuts (Enter to save, Escape to cancel)
  - Auto-commit on blur (when clicking outside)
  - Click outside add form to submit
  - Auto-sorting: likes first, then dislikes
  - Visual distinction between like/dislike types
- **Key Functions**:
  - `beginEditing()` - Start editing tag text (click handler)
  - `commitEdit()` - Save edited tag (on blur or Enter)
  - `cancelEdit()` - Cancel editing (on Escape)
  - `handleDeleteClick()` - Delete tag
  - `handleAddSubmit()` - Add new tag (Enter or click outside)
  - `handleAddCancel()` - Cancel adding new tag (Escape or × button)
- **Used In**: NotesView (likes/dislikes), Reminders (notes)

#### PersonalizationView.jsx
- **Purpose**: Combined view for personalization settings (reminders, cycle, important dates)
- **Props**: `data`, `onUpdate`
- **Features**:
  - Displays Reminders component
  - Displays CycleTracker component
  - Displays ImportantDates component
  - Provides unified interface for personalization settings
- **Use Case**: Used in mobile navigation as a dedicated personalization view

#### TodayReminders.jsx
- **Purpose**: Display today's reminders and important dates in a summary view
- **Props**: `data`, `onUpdate`
- **Features**:
  - Shows pending reminders that are due today
  - Displays important dates happening today
  - Shows cycle alerts (9 days before expected period)
  - Quick action buttons to mark reminders as done
  - Integrated into CalendarView sidebar
- **Key Functions**:
  - Filters reminders by `shouldShowTodayReminder()` utility
  - Displays today's important dates
  - Handles reminder completion actions

### Utilities

#### storage.js
- **Purpose**: Data persistence and synchronization
- **Constants**:
  - `STORAGE_KEY` - localStorage key for app data (`'wife-happiness-app-data'`)
  - `API_BASE_URL` - Server API base URL (`'https://localhost:3000/api'`)
  - `defaultData` - Default data structure with empty arrays and default values
- **Key Functions**:
  - `loadData()` - Async load from server (primary) or localStorage (fallback)
  - `loadDataSync()` - Synchronous load from localStorage
  - `saveData()` - Save to localStorage and sync to server
  - `updateData()` - Update specific data fields
  - `calculateAverageCycleLength()` - Calculate cycle statistics from periods
  - `calculateNextExpectedStart()` - Predict next period start date
  - `applyMigrations()` - Migrate old data formats to current structure
  - `migrateReminderData()` - Migrate old reminder format to include events and notes
  - `migrateCycleData()` - Migrate old cycle format to periods array
  - `syncToServer()` - Background sync to server (debounced 500ms)
- **Data Flow**:
  1. Load from server API (primary) - HTTPS endpoint
  2. Fallback to localStorage if server unavailable
  3. Save to localStorage immediately
  4. Sync to server in background (debounced 500ms)

#### cycleUtils.js
- **Purpose**: Cycle-related calculations
- **Key Functions**:
  - `getCycleDay()` - Calculate cycle day number for a date
  - `isInPastPeriod()` - Check if date is in a past period
  - `isInFuturePeriod()` - Check if date is in expected future period

#### notifications.js
- **Purpose**: Browser notification system with service worker support
- **Constants**:
  - `NOTIFICATION_ICON` - Path to notification icon (`/icons/icon-192.png`)
  - `NOTIFICATION_BADGE` - Path to notification badge (`/icons/icon-192.png`)
- **Key Functions**:
  - `displayNotification()` - Display notification via service worker or fallback to window.Notification
  - `requestNotificationPermission()` - Request browser notification permission
  - `showTestNotification()` - Show test notification
  - `checkAndShowNotifications()` - Check for notifications and show if needed
  - `scheduleDailyNotifications()` - Schedule daily notification check at 10 AM
  - `checkForNotifications()` - Check if there are any due reminders, important dates, or cycle alerts
- **Features**:
  - Daily check at 10 AM
  - Checks for due reminders, important dates, and cycle alerts
  - Shows browser notification if any notifications exist
  - Prevents duplicate notifications (once per day)
  - Service worker support with fallback to window.Notification
  - Notification payload with icon, badge, vibrate, and data

#### reminderUtils.js
- **Purpose**: Reminder-related utility functions and constants
- **Exports**:
  - `reminderTypes` - Reminder type definitions with emoji, label, default frequency, and color
  - `getReminderEvents()` - Get events array from reminder
  - `getLastEventDate()` - Get most recent event date from reminder
  - `getDaysSince()` - Calculate days since last reminder completion
  - `getDaysUntilNext()` - Calculate days until next reminder is due
  - `getStatusBadgeColor()` - Get color for reminder status badge
  - `getStatus()` - Calculate reminder status object (due, pending, ok, planned, etc.)
  - `getPreviousEventDate()` - Get second most recent event date
  - `isReminderDoneToday()` - Check if reminder was completed today
  - `shouldShowTodayReminder()` - Determine if reminder should be shown in TodayReminders
  - `formatLastEventLabel()` - Format last event date for display
- **Features**:
  - Supports planned dates for date nights
  - Handles different reminder types (flowers, surprises, dateNights, general)
  - Status calculation with planned date support

#### constants.js
- **Purpose**: Application constants and phase definitions
- **Exports**:
  - `PHASES` - Cycle phase definitions:
    - `period` (Moon Days): Days 1-5
    - `post-period` (Fresh Start): Days 6-9
    - `ovulation` (Shining Peak): Days 10-15
    - `wild-breeze` (Wild Breeze): Days 16-20
    - `pre-period` (Wind Down): Days 21-28+
  - `DEFAULT_CYCLE_LENGTH` - Default cycle length (28 days)
  - `DEFAULT_PERIOD_DURATION_DAYS` - Default period duration (4 days, 5 days total including start and end)
  - `PERIOD_NOTIFICATION_DAYS_BEFORE` - Notification timing (9 days)
  - `MAX_CYCLE_LENGTH_DAYS` - Maximum valid cycle length for validation (50 days)
  - `getPhaseFromCycleDayWithLength()` - Phase calculation function with custom cycle length
    - Returns phase based on cycle day: period (1-5), post-period (6-9), ovulation (10-15), wild-breeze (16-20), pre-period (21+)

## Backend Architecture

### Server (server/index.js)

- **Framework**: Express.js
- **Protocol**: HTTPS (requires SSL certificates)
- **Port**: 3000
- **CORS**: Enabled for local development with dynamic origin support
- **Data Storage**: JSON file in `data/wife-happiness-data.json`
- **Certificates**: SSL certificates stored in `cert/` directory
  - `local-key.pem` - Private key
  - `local-cert.pem` - Certificate
  - Generated via `npm run generate-cert`
- **Features**:
  - HTTPS server with self-signed certificates
  - CORS with credentials support
  - Private network access support
  - Automatic certificate validation on startup

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
    gifts: string  // Notes field (multiline text), backward compatible with array format
  }],
  likes: [{ id: number, text: string }],
  dislikes: [{ id: number, text: string }],
  wishlist: [{ id: number, text: string, done: boolean }],
  giftIdeas: [{ id: number, text: string, done: boolean }],
  reminders: {
    flowers: {
      enabled: boolean,
      frequency: number,
      lastDone: 'ISO string',
      events: ['YYYY-MM-DD'],
      notes: [{ type: 'like'|'dislike', text: string, id: string }]
    },
    surprises: { enabled: boolean, frequency: number, lastDone: 'ISO string', events: ['YYYY-MM-DD'] },
    dateNights: { 
      enabled: boolean, 
      frequency: number, 
      lastDone: 'ISO string', 
      events: ['YYYY-MM-DD'], 
      notes: [{ type: 'note', text: string, id: string }],
      plannedDate: 'YYYY-MM-DD' | null  // Planned date for future date night
    },
    general: { 
      enabled: boolean, 
      frequency: number, 
      lastDone: 'ISO string', 
      events: ['YYYY-MM-DD'], 
      notes: [{ type: 'love', text: string, id: string }] 
    }
  }
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
  - VitePWA plugin (Progressive Web App support)
  - date-fns (date manipulation)
  
- **Backend**:
  - Node.js
  - Express.js
  - HTTPS with self-signed certificates
  - CORS middleware

- **Storage**:
  - localStorage (browser)
  - JSON file (server)
  - sessionStorage (authentication)

## Configuration Files

### vite.config.js
- **Purpose**: Vite build configuration
- **Features**:
  - React plugin configuration
  - PWA plugin with manifest
  - GitHub Pages deployment support (base path configuration)
  - Server configuration (localhost:5173)
  - App icons configuration (192x192, 512x512)
  - Theme colors and display mode
  - Auto-update service worker registration

## Development Workflow

1. Generate SSL certificates (first time only): `npm run generate-cert`
2. Start server: `npm run server` or `scripts/start-server.bat`
3. Start frontend: `npm run dev`
4. Access app: `http://localhost:5173`
5. API available at: `https://localhost:3000/api` (HTTPS)

**Note**: The server requires SSL certificates. If certificates are missing, run `npm run generate-cert` first. The server will exit with an error message if certificates are not found.

## Build Process

- **Development**: Vite dev server with hot reload
- **Production**: `npm run build` creates optimized bundle in `dist/`
- **Preview**: `npm run preview` serves production build locally

