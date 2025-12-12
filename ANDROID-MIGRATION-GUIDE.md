# Android Migration Guide - Reading Order

Tento dokument popisuje pořadí, v jakém by měl jiný agent číst soubory, aby pochopil projekt a začal stavět Android aplikaci na bázi této web aplikace.

## 📚 Fáze 1: Přehled a kontext (5-10 minut)

### 1. **README.md** ⭐ POVINNÉ
**Proč:** Poskytuje základní přehled o projektu, funkcích a technologiích.
- Co aplikace dělá
- Základní features
- Technologický stack
- Jak spustit projekt

### 2. **FEATURES.md** ⭐ POVINNÉ
**Proč:** Detailní popis všech funkcionalit a UX/UI detailů.
- Všechny features v detailu
- Jak funguje každá část z pohledu uživatele
- UI/UX patterns a best practices
- Notifikace a připomínky

## 📐 Fáze 2: Architektura a struktura (15-20 minut)

### 3. **ARCHITECTURE.md** ⭐ POVINNÉ
**Proč:** Kompletní architektura aplikace, komponenty a data flow.
- Component hierarchy
- Struktura projektu
- Všechny komponenty a jejich účel
- Utility funkce
- Data flow
- Backend struktura

### 4. **API.md** ⭐ POVINNÉ
**Proč:** Dokumentace backend API, které Android app bude používat.
- REST API endpoints
- Request/response formáty
- HTTPS konfigurace
- CORS a autentizace
- Error handling

## 💾 Fáze 3: Data struktura a logika (20-30 minut)

### 5. **src/utils/storage.js** ⭐ POVINNÉ
**Proč:** Definuje data strukturu a defaultní hodnoty - klíčové pro Android data modely.
- `defaultData` - kompletní struktura dat
- Data migrace
- Synchronizace s serverem
- localStorage vs server storage

### 6. **src/utils/constants.js** ⭐ POVINNÉ
**Proč:** Všechny konstanty aplikace (fáze cyklu, defaultní hodnoty).
- `PHASES` - fáze menstruačního cyklu
- `DEFAULT_CYCLE_LENGTH`, `DEFAULT_PERIOD_DURATION_DAYS`
- `PERIOD_NOTIFICATION_DAYS_BEFORE`
- `MAX_CYCLE_LENGTH_DAYS`, `MAX_PERIOD_LENGTH_DAYS`
- `getPhaseFromCycleDayWithLength()` - logika výpočtu fází

### 7. **src/utils/cycleUtils.js** ⭐ POVINNÉ
**Proč:** Logika pro výpočty cyklu - kritické pro Android implementaci.
- `getCycleDay()` - výpočet dne cyklu
- `isInPastPeriod()` - kontrola minulých period
- `isInFuturePeriod()` - kontrola budoucích period
- `getAveragePeriodDurationOffset()` - průměrná délka periody

### 8. **src/utils/reminderUtils.js** ⭐ POVINNÉ
**Proč:** Logika pro reminders - status, plánování, prompty.
- `reminderTypes` - typy reminders
- `SHOW_LOVE_PROMPTS` - prompty pro "Show love"
- `getStatus()` - výpočet statusu reminderu
- `getNextPlannedDate()` - plánované datumy
- Všechny helper funkce pro reminders

### 9. **src/utils/notifications.js** ⭐ DŮLEŽITÉ
**Proč:** Logika notifikací - Android bude potřebovat podobnou logiku.
- `checkForNotifications()` - kontrola, co notifikovat
- `scheduleDailyNotifications()` - plánování notifikací
- `displayNotification()` - zobrazení notifikace
- Service worker podpora (Android bude mít native notifikace)

## 🎨 Fáze 4: UI komponenty a logika (30-45 minut)

### 10. **src/App.jsx** ⭐ POVINNÉ
**Proč:** Hlavní komponenta, routing, autentizace, data management.
- View routing (Calendar, Personalization, Notes)
- Password protection
- Data export/import
- Notification scheduling
- Settings menu

### 11. **src/components/CalendarView.jsx** ⭐ POVINNÉ
**Proč:** Nejsložitější komponenta - kalendář s eventy.
- Kalendářní grid
- Event management
- Period tracking
- Reminder events
- Planned date nights
- Sidebar s TodayReminders

### 12. **src/components/CycleTracker.jsx** ⭐ DŮLEŽITÉ
**Proč:** Komponenta pro tracking cyklu a fází.
- Period input
- Phase-based suggestions
- Cycle statistics
- Expected next start calculation

### 13. **src/components/Reminders.jsx** ⭐ DŮLEŽITÉ
**Proč:** Správa reminders - enable/disable, frequency, status.
- Reminder types (flowers, surprises, dateNights, general)
- Frequency customization
- Status tracking
- Notes pro reminders
- Planned date nights

### 14. **src/components/ImportantDates.jsx** ⭐ DŮLEŽITÉ
**Proč:** Správa důležitých dat (narozeniny, výročí).
- Add/edit/delete important dates
- Notes field
- Keyboard shortcuts

### 15. **src/components/NotesView.jsx** ⭐ DŮLEŽITÉ
**Proč:** Likes, dislikes, wishlist, gift ideas.
- TagList komponenta
- Wishlist s done/undone
- Gift ideas tracking

### 16. **src/components/PasswordProtection.jsx** ⭐ DŮLEŽITÉ
**Proč:** Autentizace - Android bude potřebovat podobnou logiku.
- 6-digit passcode
- Secret question reset
- Session management

### 17. **src/components/SecuritySettings.jsx** ⭐ DŮLEŽITÉ
**Proč:** Nastavení bezpečnosti.
- Passcode management
- Secret question setup

### 18. **src/components/TodayReminders.jsx** ⭐ DŮLEŽITÉ
**Proč:** Shrnutí dnešních reminders a events.
- Today's highlights
- Quick actions
- Cycle alerts

## 🔧 Fáze 5: Backend a konfigurace (10-15 minut)

### 19. **server/index.js** ⭐ DŮLEŽITÉ
**Proč:** Backend API, které Android app bude volat.
- Express.js server
- HTTPS konfigurace
- CORS setup
- API endpoints (/api/data, /api/health)
- Data persistence (JSON file)

### 20. **package.json** ⭐ DŮLEŽITÉ
**Proč:** Dependencies a scripts.
- Všechny npm balíčky
- Scripts pro build a development
- Verze React, date-fns, atd.

### 21. **vite.config.js** ⭐ VOLITELNÉ
**Proč:** Build konfigurace (pro Android nepotřebné, ale dobré pro kontext).

## 📋 Shrnutí - Minimální sada pro start

**Pro rychlý start (2-3 hodiny čtení):**
1. README.md
2. FEATURES.md
3. ARCHITECTURE.md
4. API.md
5. src/utils/storage.js (defaultData struktura)
6. src/utils/constants.js
7. src/utils/cycleUtils.js
8. src/utils/reminderUtils.js
9. src/App.jsx
10. src/components/CalendarView.jsx

**Pro kompletní pochopení (5-6 hodin čtení):**
- Všechny soubory výše + všechny komponenty v `src/components/`

## 🎯 Klíčové body pro Android migraci

### Data modely (z `storage.js`):
```javascript
{
  cycle: { periods, expectedNextStart, cycleLength, suggestions },
  importantDates: [{ id, name, date, gifts }],
  likes: [{ id, text }],
  dislikes: [{ id, text }],
  wishlist: [{ id, text, done }],
  giftIdeas: [{ id, text, done }],
  reminders: {
    flowers: { enabled, frequency, lastDone, events, notes, plannedDate },
    surprises: { ... },
    dateNights: { ... },
    general: { ... }
  },
  security: { password, secretQuestion, secretAnswer }
}
```

### API Endpoints:
- `GET /api/data` - načtení dat
- `POST /api/data` - uložení dat
- `GET /api/health` - health check

### Hlavní logika:
- Cycle calculations (`cycleUtils.js`)
- Reminder status (`reminderUtils.js`)
- Notifications (`notifications.js`)
- Data sync (`storage.js`)

### UI Screens (Android ekvivalenty):
1. **Password Protection** → Login Activity
2. **Calendar View** → Calendar Fragment/Activity
3. **Cycle Tracker** → Cycle Tracking Fragment
4. **Reminders** → Reminders Fragment
5. **Important Dates** → Important Dates Fragment
6. **Notes View** → Notes Fragment
7. **Security Settings** → Settings Activity

### Notifikace:
- Android bude používat `NotificationManager` místo browser notifications
- Stejná logika z `notifications.js` pro kontrolu, co notifikovat
- Daily check v 10:00 (Android `AlarmManager` nebo `WorkManager`)

### Storage:
- Android: Room Database nebo SharedPreferences + Room
- Sync s backend API stejně jako web app
- Offline-first přístup s sync na pozadí

## 🚀 Další kroky po přečtení

1. **Vytvořit Android projekt** (Kotlin + Jetpack Compose nebo XML)
2. **Implementovat data modely** (podle `defaultData` ze `storage.js`)
3. **Implementovat API client** (Retrofit/OkHttp pro HTTPS komunikaci)
4. **Implementovat Room Database** pro lokální storage
5. **Implementovat UI screens** (podle React komponent)
6. **Implementovat notification system** (WorkManager pro daily checks)
7. **Implementovat cycle calculations** (portovat z `cycleUtils.js`)
8. **Implementovat reminder logic** (portovat z `reminderUtils.js`)

---

*Tento guide by měl poskytnout kompletní přehled pro migraci web aplikace na Android.*

