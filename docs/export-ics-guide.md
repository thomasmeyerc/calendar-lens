# How to Export Your Calendar as an .ics File

An `.ics` file is a universal calendar format that works across all major calendar apps. Export one to use with CalendarLens for instant analytics on your schedule.

---

## Google Calendar

### Export All Calendars

1. Open [Google Calendar Settings](https://calendar.google.com/calendar/r/settings)
2. In the left sidebar, click **Import & export**
3. Click the **Export** tab
4. Click **Export** — this downloads a `.zip` file containing `.ics` files for each of your calendars
5. Unzip the file and use the `.ics` file(s) you want to analyze

### Export a Single Calendar

1. Go to [Google Calendar Settings](https://calendar.google.com/calendar/r/settings)
2. Under **Settings for my calendars**, click the calendar you want
3. Scroll to **Integrate calendar**
4. Click **Export calendar** — downloads a single `.ics` file

### Get a Shareable .ics Link (auto-updating)

1. In Settings, click the calendar name on the left
2. Scroll to **Integrate calendar**
3. Copy the **Secret address in iCal format** URL
4. This link always reflects your latest events — useful for ongoing analysis

---

## Microsoft Outlook (Desktop App — Windows)

### Outlook for Windows (Classic)

1. Go to **File > Open & Export > Import/Export**
2. Select **Export to a file** and click **Next**
3. Choose **iCalendar format (.ics)** — if not listed, choose **Comma Separated Values**, then convert, or use the web method below
4. Select the calendar folder and click **Next**
5. Choose a save location and click **Finish**

### Outlook for Windows (New) / Outlook for Mac

The new Outlook app does not have a direct full-calendar `.ics` export. Use **Outlook on the Web** instead (see below).

**Workaround for individual events:**
1. Open any calendar event
2. Click the **...** (More options) menu
3. Select **Export to .ics** or drag the event to your desktop — it saves as an `.ics` file

---

## Outlook on the Web (outlook.com / Office 365)

### Export via Shared Calendar Link

1. Go to [outlook.live.com/calendar](https://outlook.live.com/calendar) or your Office 365 calendar
2. Click the **Settings gear** (top right) > **View all Outlook settings**
3. Go to **Calendar > Shared calendars**
4. Under **Publish a calendar**, select the calendar you want
5. Set permissions to **Can view all details**
6. Click **Publish**
7. Copy the **ICS** link provided
8. Paste the link in a browser to download the `.ics` file, or use it directly in CalendarLens

### Export Individual Events

1. Open the event
2. Click **...** (More actions) > **Download as .ics**

---

## Apple Calendar (macOS)

### Export a Single Calendar

1. In the Calendar app, right-click (or Control-click) the calendar name in the left sidebar
2. Select **Export...**
3. Choose a save location and click **Export**
4. This saves all events from that calendar as a single `.ics` file

### Export via Finder (alternative)

1. Select one or more events in the calendar view
2. Drag them to your Desktop or a Finder folder
3. Each event saves as an individual `.ics` file

### Export All Calendars

1. Go to **File > Export > Export...** in the menu bar
2. Choose a save location
3. This creates a calendar archive (`.icbu`). To get `.ics` files instead, export each calendar individually using the right-click method above

---

## Apple Calendar (iPhone / iPad)

iOS does not have a built-in calendar export. Use one of these approaches:

- **iCloud.com**: Log in to [icloud.com/calendar](https://www.icloud.com/calendar), click the share icon next to a calendar, enable **Public Calendar**, and copy the URL. Change `webcal://` to `https://` in the URL to download the `.ics` file
- **Third-party app**: Apps like "Calendar Export" or "ICS Export" on the App Store can export your iOS calendar to `.ics`
- **Mac sync**: If your calendars sync to a Mac via iCloud, export from the macOS Calendar app instead

---

## Yahoo Calendar

1. Go to [Yahoo Calendar](https://calendar.yahoo.com)
2. Hover over the calendar name in the left sidebar
3. Click the **...** menu that appears
4. Select **Share** or **Export**
5. If a share link is offered, copy the **iCal** URL
6. To download: paste the URL into your browser, replacing `webcal://` with `https://`

---

## Fastmail

1. Go to **Settings > Calendars**
2. Click on the calendar you want to export
3. Click **Export** to download the `.ics` file directly

---

## Zoho Calendar

1. Go to [Zoho Calendar](https://calendar.zoho.com)
2. Click the **gear icon** next to the calendar name
3. Select **Export**
4. Choose **iCalendar (.ics)** format
5. Click **Export** to download

---

## Proton Calendar

1. Open [Proton Calendar](https://calendar.proton.me)
2. Go to **Settings > Calendars**
3. Click the calendar you want
4. Scroll to **Export** and click **Export**
5. Choose a date range and click **Export events**
6. The `.ics` file downloads automatically

---

## Samsung Calendar

1. Open Samsung Calendar
2. Tap **Menu** (three lines) > **Manage calendars**
3. Tap the **...** menu > **Settings**
4. Tap **Export calendars**
5. Select the calendar(s) and date range
6. Tap **Export** — the `.ics` file saves to your device

---

## Tips & Troubleshooting

| Issue | Solution |
|-------|----------|
| **Got a `.zip` instead of `.ics`** | Unzip it — the `.ics` file(s) are inside |
| **Link starts with `webcal://`** | Replace `webcal://` with `https://` to download in a browser |
| **File opens in a calendar app instead of downloading** | Right-click the link and choose **Save Link As...** |
| **Export is empty or has few events** | Check the date range — some apps only export future events by default |
| **File is too large** | Export a shorter date range, or export one calendar at a time |
| **Need recurring/ongoing export** | Use a shared calendar URL (Google, Outlook, iCloud) for always-current data |

---

## Quick Reference

| Platform | Method | Full Calendar? |
|----------|--------|---------------|
| Google Calendar | Settings > Import & Export > Export | Yes |
| Outlook (Web) | Settings > Shared Calendars > Publish > ICS link | Yes |
| Outlook (Desktop) | File > Import/Export or drag events | Varies |
| Apple Calendar (Mac) | Right-click calendar > Export | Yes |
| Apple Calendar (iOS) | iCloud.com public link or third-party app | Yes (via workaround) |
| Yahoo Calendar | Calendar menu > Share/Export | Yes |
| Fastmail | Settings > Calendars > Export | Yes |
| Zoho Calendar | Gear icon > Export | Yes |
| Proton Calendar | Settings > Calendars > Export | Yes |
| Samsung Calendar | Menu > Settings > Export calendars | Yes |
