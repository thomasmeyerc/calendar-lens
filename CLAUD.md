# ☁️ Calendar Analysis App

## Overview

A modern web application that helps users analyze their calendar data to gain insights into how they spend their time. The app visualizes meeting patterns, time allocation, and productivity trends to help users make better decisions about their schedules.

## Tech Stack

| Layer        | Technology              |
|-------------|------------------------|
| Frontend    | HTML, CSS, JavaScript   |
| Styling     | Vanilla CSS (modern design system) |
| Charts      | Chart.js or D3.js       |
| Data Format | ICS / CSV import        |
| Storage     | LocalStorage / IndexedDB |

## Core Features

### 📊 Dashboard
- Weekly/monthly/yearly time breakdown
- Category-based analysis (meetings, focus time, breaks)
- Trend visualization over time

### 📅 Calendar Import
- Upload `.ics` files from Google Calendar, Outlook, or Apple Calendar
- CSV import support for custom data
- Drag-and-drop file upload

### 🔍 Insights Engine
- Busiest days/hours heatmap
- Meeting duration analysis
- Time spent per category (e.g., 1:1s, team syncs, deep work)
- "Meeting load" score per week

### 📈 Visualizations
- Pie charts for time allocation
- Bar charts for daily/weekly comparisons
- Heatmaps for busy-hour patterns
- Line graphs for trends over time

## Design Direction

- **Dark mode first** with elegant glassmorphism elements
- **Rich color palette**: Deep purples, electric blues, warm accents
- **Smooth animations**: Micro-interactions on hover, chart transitions
- **Premium feel**: Modern typography (Inter/Outfit), generous spacing
- **Responsive**: Fully adaptive from mobile to desktop

## Project Structure (Planned)

```
Calendar Analysis App/
├── index.html          # Main entry point
├── css/
│   └── styles.css      # Design system & styles
├── js/
│   ├── app.js          # Main application logic
│   ├── parser.js       # ICS/CSV file parsing
│   ├── analytics.js    # Data analysis engine
│   └── charts.js       # Chart rendering
├── assets/
│   └── icons/          # SVG icons
├── CLAUDE.md           # This file
└── README.md           # User-facing documentation
```

## Getting Started

1. Open `index.html` in a browser (or use a local dev server)
2. Upload a calendar export file (`.ics` or `.csv`)
3. Explore your time analytics on the dashboard

## Status

🚧 **Project Status**: Not yet started — scaffolding phase.
