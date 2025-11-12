# Quick Start Guide

## Step-by-Step Instructions

### 1. Start the Server
- **Double-click `scripts/start-server.bat`**
- Wait for the message: `Local: http://localhost:5173`
- **Keep this window open!** (Don't close it)

### 2. Open in Browser
- Open your browser (Chrome, Opera, Edge, etc.)
- Type in the address bar: `http://localhost:5173`
- Press Enter

### 3. If It Doesn't Work

**Check 1: Is the server running?**
- Look at the `scripts/start-server.bat` window
- You should see: `Local: http://localhost:5173`
- If you see errors, share them

**Check 2: Are you using the correct URL?**
- Must be: `http://localhost:5173`
- NOT: `https://localhost:5173`
- NOT: `localhost:5173` (missing http://)

**Check 3: Try a different browser**
- If Chrome doesn't work, try Opera or Edge
- Sometimes browser extensions block localhost

**Check 4: Check Windows Firewall**
- Windows might be blocking the connection
- Try temporarily disabling firewall to test

**Check 5: Check if port is in use**
- Close all terminal windows
- Restart `scripts/start-server.bat`
- If it says port is in use, restart your computer

## Troubleshooting

### Error: "ERR_CONNECTION_REFUSED"
- **Solution:** The server isn't running. Start `scripts/start-server.bat` first.

### Error: "Port 5173 is already in use"
- **Solution:** Another server is running. Close it or restart your computer.

### Page loads but shows errors
- **Solution:** Check browser console (F12) and share the error messages.

### Nothing happens when clicking buttons
- **Solution:** Check browser console (F12) for JavaScript errors.

## Still Not Working?

1. Open browser console (Press F12)
2. Go to the "Console" tab
3. Copy any red error messages
4. Share them so we can fix the issue

