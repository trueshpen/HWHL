# Features Documentation

## Overview

Wife Happiness App is designed to help you remember and track everything that makes your wife happy. This document provides detailed information about all features.

## Core Features

### 📅 Calendar View

The main calendar interface displays a monthly view with all events, reminders, and cycle information.

**Features:**
- Monthly calendar grid with navigation
- Shows full weeks (includes days from previous and next month for complete week view)
- Visual indicators for:
  - Cycle periods (past and future)
  - Important dates
  - Reminder events
  - Cycle day numbers and phases
- Click on any day to:
  - Mark period start/end
  - Add/remove reminder events
  - View all events for that day
- Event menu with quick actions
- "Today" button to jump to current month

**Cycle Visualization:**
- Past periods: Highlighted in calendar
- Future expected periods: Highlighted in calendar
- Cycle day numbers: Displayed on each day
- Phase icons: Visual indicators for cycle phases

**Event Types:**
- 🌛 Period start/end
- 🔔 9-day notification before expected period
- 📅 Important dates
- 🎉 Birthdays
- 🌸 Flowers reminder
- 🎁 Surprises reminder
- 💑 Date nights reminder
- 💕 General love reminders

---

### 🔄 Cycle Tracking

Track menstrual cycle with automatic calculations and phase-based suggestions.

**Core Functionality:**
- **Period Tracking**: Mark period start and end dates on calendar
- **Automatic Calculations**:
  - Average cycle length (calculated from historical data)
  - Expected next period start date
  - Current cycle day number
- **Cycle Phases**:
  - 🌛 **Moon Days** (Days 1-5): Period phase
  - 🌱 **Fresh Start** (Days 6-9): Post-period phase
  - ✨ **Shining Peak** (Days 10-15): Ovulation phase
  - 🍃 **Wind Down** (Days 16-28+): Pre-period phase

**Phase-Based Suggestions:**
- Add custom "To Do" and "Not To Do" items for each phase
- Edit suggestions for current or all phases
- Suggestions appear based on current cycle day
- Organized by phase for easy reference

**Notifications:**
- 9-day advance notification before expected period start
- Visual indicator on calendar
- Helps with planning and preparation

**Statistics:**
- Average cycle length (calculated from 2+ periods)
- Number of cycles used for calculation
- Expected next start date
- Current cycle day

**Data Management:**
- Click calendar days to mark start/end
- Automatic end date (4 days) if not specified
- Remove periods from calendar
- Prevent overlapping periods

---

### 📅 Important Dates

Manage birthdays, anniversaries, and special occasions with automatic reminders.

**Features:**
- Add/edit/delete important dates
- Notes field per date (multiline textarea for detailed notes)
- Automatic yearly recurrence
- Multiple notification reminders:
  - 1 month before
  - 1 week before
  - 1 day before
  - Day of event
- Keyboard shortcuts:
  - Escape key to cancel editing
  - Shift/Ctrl+Enter to submit form

**Date Information:**
- Event name (e.g., "Birthday", "Anniversary")
- Date (stored as date, displayed yearly)
- Notes (multiline text field for gifts, preferences, or any notes)
- Notification dates (calculated automatically)

**Data Format:**
- Notes are stored as string (supports multiline text)
- Backward compatible with old array format (automatically converted)

**Calendar Integration:**
- Dates appear on calendar with emoji indicators
- 🎉 for birthdays
- 📅 for other important dates
- Notification dots on reminder dates

**Use Cases:**
- Birthdays
- Anniversaries
- Special occasions
- Holidays
- Any recurring important dates

---

### 💭 Reminders System

Track and manage regular reminders with customizable frequencies.

#### Reminder Types

**🌸 Flowers**
- Regular reminders to bring flowers
- Default frequency: Every 7 days
- Notes: Track likes/dislikes about flowers
- Status tracking: Due, pending, ok

**🎁 Small Surprises**
- Reminders for thoughtful surprises
- Default frequency: Every 2 days
- Status tracking: Due, pending, ok

**💑 Date Nights**
- Regular date night reminders
- Default frequency: Every 7 days
- Notes: Track date ideas and preferences
- Status tracking: Due, pending, ok, planned
- **Planned Date Feature**: Plan specific date nights in advance
  - Set planned date for future date nights
  - Planned dates appear on calendar
  - Status shows "Planned in X days" or "Date night today!"
  - Planned date automatically clears when date night is marked as done
  - Can plan date nights from calendar day menu or reminders component

**💕 Show Love (General)**
- Daily reminders to show love
- Default frequency: Every 1 day
- Special features:
  - Multiple entries per day allowed
  - Motivational phrases when marked done
  - Customizable love notes
  - Default notes included:
    - "She is the love of my life"
    - "I must make her happy EVERY DAY"
    - "Support her, take care of her"

#### Reminder Features

**Status Indicators:**
- 🟢 **Green**: More than 1 day until due
- 🟡 **Yellow**: Due today or 1 day before/after
- 🔴 **Red**: 1-7 days overdue
- ⚫ **Dark Red**: 7+ days overdue
- ⚪ **Gray**: Disabled or never done

**Status Messages:**
- "Due in X days" - Upcoming
- "Due (X days ago)" - Overdue
- "Never done" - No history
- "Disabled" - Reminder turned off

**Event Tracking:**
- History of all completed reminders
- Last done date
- Days since last completion
- Days until next due date

**Customization:**
- Enable/disable each reminder type
- Customize frequency (in days)
- Edit frequency inline
- Add notes (likes/dislikes, ideas)

**Actions:**
- Mark as done (adds to event history)
- Clear today's entry (if already marked)
- Edit frequency
- Add/edit notes

---

### 📝 Notes View

Organize information about likes, dislikes, and wishlist items.

#### ❤️ Likes

Track things your wife loves.

**Features:**
- Add/remove items
- Edit mode for management
- Simple text list
- Easy to update as you learn more

**Use Cases:**
- Favorite foods
- Preferred activities
- Things that make her happy
- Preferences and tastes

#### 💔 Dislikes

Remember things to avoid.

**Features:**
- Add/remove items
- Edit mode for management
- Simple text list
- Helps avoid mistakes

**Use Cases:**
- Things she doesn't like
- Activities to avoid
- Preferences to remember
- Things that upset her

#### 🎁 Wishlist

Track things she wants (not connected to events).

**Features:**
- Add/remove items
- Mark items as done (purchased)
- Visual indication of completed items
- Always visible (no edit mode needed)

**Use Cases:**
- Gift ideas
- Things she mentioned wanting
- Items to buy
- Surprise ideas

**Wishlist Item States:**
- ✅ Done: Item has been purchased/completed
- ⬜ Pending: Item not yet purchased

---

## Data Management

### Storage

**Dual Storage System:**
1. **Server File**: `data/wife-happiness-data.json` (primary)
2. **Browser localStorage**: Fallback for offline use

**Sync Behavior:**
- Load from server on app start
- Save to localStorage immediately on changes
- Sync to server in background (debounced 500ms)
- Works offline with localStorage

### Data Export/Import

**Export:**
- Download data as JSON file
- Useful for backups
- Transfer data between devices

**Import:**
- Restore from exported JSON file
- Overwrites current data
- Useful for restoring backups

### Data Migration

The app automatically migrates old data formats:
- Old cycle format → New periods array format
- Old reminder format → New format with events array
- Missing fields → Default values added

---

## User Interface

### Navigation

- **Calendar View**: Main calendar with sidebar
- **Notes View**: Likes, dislikes, and wishlist
- **View Switcher**: Toggle between Calendar and Notes

### Responsive Design

- Mobile-friendly layouts
- Touch-friendly buttons
- Responsive grid layouts
- Works on desktop and mobile browsers

### Visual Indicators

- **Colors**: Status-based color coding
- **Emojis**: Visual icons for different event types
- **Badges**: Status indicators for reminders
- **Highlights**: Important information highlighted

---

## Notifications & Alerts

### Browser Notifications

The app supports browser notifications to alert you about important events and reminders.

**Features:**
- **Daily Check**: Automatically checks for notifications at 10 AM daily
- **Notification Types**:
  - Due reminders (flowers, surprises, date nights, general)
  - Important dates (1 month, 1 week, 1 day before, and day of)
  - Cycle alerts (9 days before expected period start)
- **Permission**: Click "Allow notifications" button in header to enable
- **Smart Behavior**:
  - Shows notification only once per day
  - Checks if any notifications exist before showing
  - Uses browser's native notification system

**How It Works:**
1. Click "Allow notifications" button in the app header
2. Grant permission when browser prompts
3. App checks daily at 10 AM for any notifications
4. If notifications exist, browser shows a notification
5. Notification appears even if app is not open (browser must be running)

**Test Notifications:**
- Click "Allow notifications" button to test notification system
- Useful for verifying notification permissions

### Calendar Notifications

- **9-day alert**: Before expected period start
- **Important date reminders**: 1 month, 1 week, 1 day before
- **Visual indicators**: Notification dots on calendar days

### Reminder Status

- **Visual badges**: Color-coded status indicators
- **Status messages**: Clear text descriptions
- **Due dates**: Days until next due or days overdue

---

## Best Practices

### Getting Started

1. **Start with Cycle Tracking**: Add last period start date
2. **Add Important Dates**: Add birthdays and anniversaries
3. **Set Up Reminders**: Enable and customize frequencies
4. **Build Notes**: Add likes, dislikes, and wishlist items
5. **Check Daily**: Review calendar for upcoming events

### Regular Maintenance

- **Update Cycle**: Mark period start/end dates
- **Review Reminders**: Mark as done when completed
- **Update Notes**: Add new likes/dislikes as you learn
- **Check Calendar**: Review upcoming important dates
- **Update Wishlist**: Mark items as done when purchased

### Tips

- Use phase-based suggestions to plan activities
- Check reminder status daily
- Keep notes updated regularly
- Use wishlist for gift ideas
- Review calendar weekly for upcoming events

---

## Technical Details

### Cycle Calculations

- **Average Cycle Length**: Calculated from consecutive period start dates
- **Minimum Cycles**: Requires 2+ periods for calculation
- **Default Length**: 28 days if insufficient data
- **Next Expected Start**: Based on last period start + average length

### Date Handling

- **Format**: YYYY-MM-DD for storage
- **Display**: Localized format for user
- **Timezone**: Uses local timezone
- **Recurrence**: Important dates recur yearly

### Reminder Logic

- **Frequency**: Days between reminders
- **Due Calculation**: Last done date + frequency
- **Status**: Based on days until/since due date
- **Events**: History of all completed reminders

---

## Future Enhancements

Potential features for future versions:

- [ ] Phone app version (React Native)
- [ ] Cloud sync option
- [ ] More reminder types
- [ ] Export/import functionality (enhanced)
- [ ] Data analytics and insights
- [ ] Customizable themes
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Calendar integration (Google Calendar, etc.)
- [ ] Sharing features

