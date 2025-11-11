# 💕 Wife Happiness App

A beautiful web application to help you remember and track everything that makes your wife happy - from important dates and cycle tracking to reminders and wishlists.

## Features

### 📅 Calendar View
- **Monthly calendar** with all events and notifications
- Visual indicators for cycle dates, important dates, and reminders
- Easy navigation between months

### 🔄 Cycle Tracking
- Track cycle start and end dates
- Automatic calculation of expected next start date
- 8-day advance notification before expected start
- Customizable cycle length

### 📅 Important Dates
- Add birthdays, anniversaries, and special occasions
- Automatic notifications:
  - 1 month before
  - 1 week before
  - 1 day before
  - Day of event
- Preferred gifts list for each event

### 💭 Reminders System
- **Flowers** - Regular reminders to bring flowers
- **Small Surprises** - Reminders for thoughtful surprises
- **Date Nights** - Regular date night reminders
- **General Reminders** - Daily reminders to:
  - Remember she is the love of your life
  - Make her happy EVERY DAY
  - Support her and take care of her
- Customizable frequency for each reminder type
- Track when each reminder was last completed
- Visual status indicators (due, pending, ok)

### 📝 Notes View
- **Likes** - Track things she loves
- **Dislikes** - Remember things to avoid
- **Wishlist** - Keep track of things she wants (not connected to events)
  - Mark items as done when purchased
  - Easy add/remove functionality

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Running the App

**IMPORTANT: You must start the server first!**

**Method 1: Use the batch file (Easiest)**
1. Double-click `START-SERVER.bat`
2. Wait for the message "Local: http://localhost:5173"
3. Open `http://localhost:5173` in your browser
4. Keep the server window open while using the app

**Method 2: Use command line**
```bash
npm run dev
```
Then open `http://localhost:5173` in your browser

**Method 3: Production build**
```bash
npm run build
npm run preview
```
Then open the URL shown in the terminal

**Note:** If you see "ERR_CONNECTION_REFUSED", it means the server isn't running. Start it first using Method 1 or 2 above.

## Data Storage

**Automatic Data Storage:**
- All data you enter is automatically saved to your browser's localStorage
- Data persists across browser sessions
- For backup or transferring data, use the Export button to download your data as a JSON file

**Manual Backup/Restore:**
- Click **💾 Export** to manually download your data as a JSON file
- Click **📂 Import** to restore data from a previously exported file
- Useful for backing up or transferring data between devices

## Usage Tips

1. **Start with Cycle Tracking**: Add the last cycle start date to get automatic notifications
2. **Add Important Dates**: Add birthdays, anniversaries, and special occasions with preferred gifts
3. **Set Up Reminders**: Enable and customize reminder frequencies based on your preferences
4. **Build Your Notes**: Regularly update likes, dislikes, and wishlist as you learn more
5. **Check Calendar Daily**: The calendar view shows all upcoming events and notifications

## Future Plans

- Phone app version (React Native or similar)
- Cloud sync option
- More reminder types
- Export/import functionality

## Technology Stack

- React 18
- Vite
- date-fns for date handling
- LocalStorage for data persistence
- Modern CSS with custom properties

---

*Created with love and care* 💕
