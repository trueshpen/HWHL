// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Show a test notification
export const showTestNotification = async () => {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    alert('Notification permission is required. Please allow notifications in your browser settings.')
    return false
  }

  new Notification('', {
    body: 'New notification in the HWHL app',
    icon: '/favicon.ico',
    tag: `test-${Date.now()}`,
    requireInteraction: false
  })

  return true
}

// Check if there are any notifications today and show them
export const checkAndShowNotifications = async (data) => {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    return
  }

  // Check if we've already shown notifications today
  const today = new Date().toISOString().split('T')[0]
  const lastNotificationDate = localStorage.getItem('lastNotificationDate')
  
  // If we've already shown notifications today, don't show again
  if (lastNotificationDate === today) {
    return
  }

  const hasNotifications = checkForNotifications(data)

  if (hasNotifications) {
    // Mark that we've shown notifications today
    localStorage.setItem('lastNotificationDate', today)

    // Show notification
    new Notification('', {
      body: 'New notification in the HWHL app',
      icon: '/favicon.ico',
      tag: `notification-${today}`,
      requireInteraction: false
    })
  }
}

// Check if there are any notifications (reminders due, important dates, cycle alerts)
const checkForNotifications = (data) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check due reminders
  if (data.reminders) {
    const reminderTypes = ['flowers', 'surprises', 'dateNights', 'general']
    for (const type of reminderTypes) {
      const reminder = data.reminders[type]
      if (reminder && reminder.enabled) {
        const lastEventDate = reminder.events && reminder.events.length > 0
          ? reminder.events[0]
          : reminder.lastDone

        if (!lastEventDate) {
          // Never done - it's due
          return true
        }

        const lastEvent = typeof lastEventDate === 'string'
          ? (lastEventDate.includes('T') ? new Date(lastEventDate) : new Date(lastEventDate + 'T00:00:00'))
          : new Date(lastEventDate)
        lastEvent.setHours(0, 0, 0, 0)

        const daysSince = Math.floor((today - lastEvent) / (1000 * 60 * 60 * 24))
        if (daysSince >= reminder.frequency) {
          return true
        }
      }
    }
  }

  // Check important dates
  if (data.importantDates && data.importantDates.length > 0) {
    const currentYear = today.getFullYear()
    for (const dateObj of data.importantDates) {
      const eventDate = new Date(dateObj.date)
      const eventMonth = eventDate.getMonth()
      const eventDay = eventDate.getDate()
      const thisYearDate = new Date(currentYear, eventMonth, eventDay)
      thisYearDate.setHours(0, 0, 0, 0)

      // Check if today is the event day or notification day
      if (thisYearDate.getTime() === today.getTime()) {
        return true
      }

      // Check 1 day before
      const dayBefore = new Date(thisYearDate)
      dayBefore.setDate(dayBefore.getDate() - 1)
      if (dayBefore.getTime() === today.getTime()) {
        return true
      }

      // Check 1 week before
      const weekBefore = new Date(thisYearDate)
      weekBefore.setDate(weekBefore.getDate() - 7)
      if (weekBefore.getTime() === today.getTime()) {
        return true
      }

      // Check 1 month before
      const monthBefore = new Date(thisYearDate)
      monthBefore.setDate(monthBefore.getDate() - 30)
      if (monthBefore.getTime() === today.getTime()) {
        return true
      }
    }
  }

  // Check 8-day cycle alert
  if (data.cycle?.expectedNextStart) {
    const nextStart = new Date(data.cycle.expectedNextStart)
    nextStart.setHours(0, 0, 0, 0)
    const notificationDate = new Date(nextStart)
    notificationDate.setDate(notificationDate.getDate() - 8)
    notificationDate.setHours(0, 0, 0, 0)

    if (notificationDate.getTime() === today.getTime()) {
      return true
    }
  }

  return false
}

// Schedule daily check at 10 AM
let notificationTimeout = null

export const scheduleDailyNotifications = (data, onDataUpdate) => {
  // Clear any existing timer
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }

  // Schedule precise check for 10 AM
  const scheduleNextCheck = () => {
    const now = new Date()
    const nextCheck = new Date()
    nextCheck.setHours(10, 0, 0, 0)
    nextCheck.setSeconds(0)
    nextCheck.setMilliseconds(0)

    // If 10 AM has already passed today, schedule for tomorrow
    if (now >= nextCheck) {
      nextCheck.setDate(nextCheck.getDate() + 1)
    }

    const msUntilCheck = nextCheck.getTime() - now.getTime()

    notificationTimeout = setTimeout(() => {
      const freshData = onDataUpdate ? onDataUpdate() : data
      checkAndShowNotifications(freshData)
      scheduleNextCheck() // Schedule next day
    }, msUntilCheck)
  }

  // Check immediately if it's exactly 10 AM (within 1 minute window)
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  if (currentHour === 10 && currentMinute === 0) {
    const freshData = onDataUpdate ? onDataUpdate() : data
    checkAndShowNotifications(freshData)
  }

  scheduleNextCheck()

  return () => {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
      notificationTimeout = null
    }
  }
}

