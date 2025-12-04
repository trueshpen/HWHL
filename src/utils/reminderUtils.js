import { format, differenceInDays, isSameDay, addHours } from 'date-fns'

const normalizeDateOnly = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(`${dateStr}T00:00:00`)
  date.setHours(0, 0, 0, 0)
  return date
}

export const reminderTypes = {
  flowers: { emoji: '🌸', label: 'Flowers', defaultFrequency: 7, color: '#ff6b9d' },
  surprises: { emoji: '🎁', label: 'Small Surprises', defaultFrequency: 2, color: '#fdcb6e' },
  dateNights: { emoji: '💑', label: 'Date Nights', defaultFrequency: 7, color: '#c44569' },
  general: { emoji: '💕', label: 'Show love', defaultFrequency: 1, color: '#f8b5c0' }
}

export const SHOW_LOVE_PROMPTS = [
  { id: 1, text: 'Tell her “I love you.”' },
  { id: 2, text: 'Offer a small gesture, like making her tea.' },
  { id: 3, text: 'Give her a hug or kiss.' },
  { id: 4, text: 'Ask how she’s feeling.' },
  { id: 5, text: 'Ask how work was today.' },
  { id: 6, text: 'Send her a sweet message just because.' },
  { id: 7, text: 'Prepare her favorite snack or drink.' },
  { id: 8, text: 'Wish her a nice day first thing in the morning.' },
  { id: 9, text: 'Thank her for something she usually does automatically.' },
  { id: 10, text: 'Give her a longer shoulder or back massage.' },
  { id: 12, text: 'Plan a cozy movie or series night and let her choose.' },
  { id: 14, text: 'Give a sincere compliment about something specific she did.' },
  { id: 21, text: 'Give a specific compliment about one detail, like "Your new manicure looks awesome."' },
  { id: 15, text: 'Send her a cute gif or meme during the day.' },
  { id: 17, text: 'Ask for her advice or opinion on something.' },
  { id: 19, text: 'Hold her coat or open the door for her.' },
  { id: 20, text: 'Bring up a happy memory you share.' }
]

const SHOW_LOVE_MORNING_PROMPT_ID = 8

const getMorningShowLovePrompt = () => {
  return SHOW_LOVE_PROMPTS.find(prompt => prompt.id === SHOW_LOVE_MORNING_PROMPT_ID) || SHOW_LOVE_PROMPTS[0] || null
}

const getSeededIndex = (seed, length) => {
  if (length <= 0) return 0
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647
  }
  return Math.abs(hash) % length
}

export const getShowLovePrompt = (reminder, now = new Date()) => {
  const morningPrompt = getMorningShowLovePrompt()
  if (!morningPrompt) return ''

  if (!reminder) {
    return morningPrompt.text
  }

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayStr = format(today, 'yyyy-MM-dd')
  const events = Array.isArray(reminder.events) ? reminder.events : []
  const todayCount = events.filter(eventDate => eventDate === todayStr).length

  if (todayCount === 0) {
    return morningPrompt.text
  }

  const followUpPrompts = SHOW_LOVE_PROMPTS.filter(prompt => prompt.id !== SHOW_LOVE_MORNING_PROMPT_ID)
  if (followUpPrompts.length === 0) {
    return morningPrompt.text
  }

  const seed = `${todayStr}-${todayCount}`
  const index = getSeededIndex(seed, followUpPrompts.length)
  return followUpPrompts[index].text
}

const GENERAL_COOLDOWN_HOURS = 1
const QUIET_HOURS_START = 21 // 21:00
const QUIET_HOURS_END = 6 // 06:00

const isBeforeMorningWindow = (date) => date.getHours() < QUIET_HOURS_END

const adjustToAllowedReminderTime = (date) => {
  const adjusted = new Date(date)
  const hour = adjusted.getHours()
  if (hour >= QUIET_HOURS_START) {
    adjusted.setDate(adjusted.getDate() + 1)
    adjusted.setHours(QUIET_HOURS_END, 0, 0, 0)
  } else if (hour < QUIET_HOURS_END) {
    adjusted.setHours(QUIET_HOURS_END, 0, 0, 0)
  }
  return adjusted
}

const getNextGeneralReminderTime = (reminder) => {
  if (!reminder?.lastDone) return null
  const lastDone = new Date(reminder.lastDone)
  if (Number.isNaN(lastDone.getTime())) return null
  const base = addHours(lastDone, GENERAL_COOLDOWN_HOURS)
  const hour = base.getHours()
  if (hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END) {
    return adjustToAllowedReminderTime(base)
  }
  return base
}

export const getReminderEvents = (reminder) => reminder?.events || []

export const getSortedPlannedDates = (reminder) => {
  if (!reminder || !Array.isArray(reminder.plannedDates)) return []
  return [...reminder.plannedDates].sort()
}

export const getNextPlannedDate = (reminder) => {
  const sorted = getSortedPlannedDates(reminder)
  if (sorted.length === 0) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = sorted.find(dateStr => {
    const normalized = normalizeDateOnly(dateStr)
    return normalized && normalized >= today
  })
  return upcoming || sorted[sorted.length - 1]
}

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
  const nextPlannedDate = getNextPlannedDate(reminder)
  if (nextPlannedDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const planned = normalizeDateOnly(nextPlannedDate)
    if (!planned) return '#ccc'
    const diff = differenceInDays(planned, today)
    if (diff > 0) return 'var(--info, #48dbfb)'
    if (diff === 0) return 'var(--warning)'
    return '#ff4757'
  }
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (type === 'dateNights') {
    const nextPlannedDate = getNextPlannedDate(reminder)
    if (nextPlannedDate) {
      const plannedDate = normalizeDateOnly(nextPlannedDate)
      if (plannedDate) {
        const diff = differenceInDays(plannedDate, today)
        if (diff > 0) {
          return {
            status: 'planned',
            message: `Planned in ${diff} day${diff !== 1 ? 's' : ''}`,
            plannedDate: nextPlannedDate,
            daysUntilPlanned: diff,
            isDueToday: false
          }
        }
        if (diff === 0) {
          return {
            status: 'planned-today',
            message: 'Date night today!',
            plannedDate: nextPlannedDate,
            daysUntilPlanned: 0,
            isDueToday: true
          }
        }
        const daysOverdue = Math.abs(diff)
        return {
          status: 'planned-overdue',
          message: `Planned ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
          plannedDate: nextPlannedDate,
          daysUntilPlanned: diff,
          isDueToday: true
        }
      }
    }
  }

  const lastEvent = getLastEventDate(reminder)
  if (!lastEvent) return { status: 'pending', message: 'Never done' }

  const daysSince = getDaysSince(reminder)
  if (daysSince === null) return { status: 'pending', message: 'Never done' }

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
    const message = daysOverdue === 0
      ? 'Due today'
      : `Due (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago)`
    return { status: 'due', message, isDoneToday, isDueToday, daysSince, daysUntil }
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
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  if (type === 'general') {
    const nextGeneralTime = getNextGeneralReminderTime(reminder)
    if (!nextGeneralTime) {
      return true
    }
    return now >= nextGeneralTime
  }

  if (isBeforeMorningWindow(now)) {
    return false
  }

  if (type === 'dateNights') {
    const nextPlannedDate = getNextPlannedDate(reminder)
    if (nextPlannedDate) {
      const planned = normalizeDateOnly(nextPlannedDate)
      if (planned && planned <= today) {
        return true
      }
    }
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

