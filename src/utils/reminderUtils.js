import { format, differenceInDays, isSameDay } from 'date-fns'

export const reminderTypes = {
  flowers: { emoji: '🌸', label: 'Flowers', defaultFrequency: 7, color: '#ff6b9d' },
  surprises: { emoji: '🎁', label: 'Small Surprises', defaultFrequency: 2, color: '#fdcb6e' },
  dateNights: { emoji: '💑', label: 'Date Nights', defaultFrequency: 7, color: '#c44569' },
  general: { emoji: '💕', label: 'Show love', defaultFrequency: 1, color: '#f8b5c0' }
}

export const getReminderEvents = (reminder) => reminder?.events || []

export const getLastEventDate = (reminder) => {
  if (!reminder) return null
  if (reminder.events && reminder.events.length > 0) {
    return reminder.events[0]
  }
  return reminder.lastDone || null
}

export const getDaysSince = (reminder) => {
  if (!reminder) return null
  const lastEvent = getLastEventDate(reminder)
  if (!lastEvent) return null
  const lastEventDate = typeof lastEvent === 'string'
    ? (lastEvent.includes('T') ? new Date(lastEvent) : new Date(lastEvent + 'T00:00:00'))
    : new Date(lastEvent)
  return differenceInDays(new Date(), lastEventDate)
}

export const getDaysUntilNext = (reminder) => {
  const daysSince = getDaysSince(reminder)
  if (daysSince === null) return null
  return reminder.frequency - daysSince
}

export const getStatusBadgeColor = (reminder) => {
  if (!reminder) return '#ccc'
  if (!reminder.enabled) return '#ccc'
  const lastEvent = getLastEventDate(reminder)
  if (!lastEvent) return '#ccc'

  const daysUntil = getDaysUntilNext(reminder)
  if (daysUntil === null) return '#ccc'

  if (daysUntil > 1) return 'var(--success)'
  if (daysUntil >= -1) return 'var(--warning)'
  if (daysUntil >= -7) return '#ff4757'
  return '#c44569'
}

export const getStatus = (reminder, type) => {
  if (!reminder) return { status: 'pending', message: 'Never done' }
  if (!reminder.enabled) return { status: 'disabled', message: 'Disabled' }
  const lastEvent = getLastEventDate(reminder)
  if (!lastEvent) return { status: 'pending', message: 'Never done' }

  const daysSince = getDaysSince(reminder)
  if (daysSince === null) return { status: 'pending', message: 'Never done' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastEventDate = typeof lastEvent === 'string'
    ? (lastEvent.includes('T') ? new Date(lastEvent) : new Date(lastEvent + 'T00:00:00'))
    : new Date(lastEvent)
  lastEventDate.setHours(0, 0, 0, 0)
  const isDoneToday = isSameDay(lastEventDate, today)

  const isDueToday = daysSince >= reminder.frequency && daysSince < reminder.frequency + 1

  if (type === 'general') {
    return { status: 'ok', message: '', isDoneToday, isDueToday: false, daysSince }
  }

  const daysUntil = reminder.frequency - daysSince

  if (daysSince >= reminder.frequency) {
    const daysOverdue = daysSince - reminder.frequency
    return { status: 'due', message: `Due (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago)`, isDoneToday, isDueToday, daysSince, daysUntil }
  }

  return { status: 'ok', message: `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`, isDoneToday, isDueToday, daysSince, daysUntil }
}

export const getPreviousEventDate = (reminder) => {
  if (!reminder) return null
  if (!reminder.events || reminder.events.length === 0) return null
  if (reminder.events.length > 1) {
    return reminder.events[1]
  }
  return null
}

export const isReminderDoneToday = (reminder) => {
  const lastEvent = getLastEventDate(reminder)
  if (!lastEvent) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastEventDate = typeof lastEvent === 'string'
    ? (lastEvent.includes('T') ? new Date(lastEvent) : new Date(lastEvent + 'T00:00:00'))
    : new Date(lastEvent)
  lastEventDate.setHours(0, 0, 0, 0)
  return isSameDay(lastEventDate, today)
}

export const shouldShowTodayReminder = (reminder, type) => {
  if (!reminder || !reminder.enabled) return false
  if (type === 'general') {
    return !isReminderDoneToday(reminder)
  }
  const status = getStatus(reminder, type)
  return status.status === 'due' || status.isDueToday
}

export const formatLastEventLabel = (reminder) => {
  const lastEventDate = getLastEventDate(reminder)
  if (!lastEventDate) return ''
  const lastEvent = new Date(lastEventDate.includes('T') ? lastEventDate : `${lastEventDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastEvent.setHours(0, 0, 0, 0)
  return isSameDay(lastEvent, today) ? 'Today' : `Last: ${format(lastEvent, 'd MMM')}`
}

