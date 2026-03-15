import { useState, useCallback, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useCalendar } from './hooks/useCalendar';
import { useAnalytics } from './hooks/useAnalytics';
import { Navbar } from './components/Layout/Navbar';
import { AuthScreen } from './components/Auth/AuthScreen';
import { CalendarPicker } from './components/Picker/CalendarPicker';
import { UploadScreen } from './components/Upload/UploadScreen';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import type { Attendee, CalendarEvent } from './types/calendar';

type Screen = 'auth' | 'picker' | 'upload' | 'dashboard';

const SAMPLE_PEOPLE = [
  { name: 'Sarah Chen', email: 'sarah.chen@company.com' },
  { name: 'James Wilson', email: 'james.wilson@company.com' },
  { name: 'Maria Garcia', email: 'maria.garcia@company.com' },
  { name: 'Alex Kim', email: 'alex.kim@company.com' },
  { name: 'David Brown', email: 'david.brown@company.com' },
  { name: 'Emma Taylor', email: 'emma.taylor@company.com' },
  { name: 'Ryan Patel', email: 'ryan.patel@company.com' },
  { name: 'Lisa Johnson', email: 'lisa.johnson@company.com' },
  { name: 'Mike Davis', email: 'mike.davis@company.com' },
  { name: 'Nina Sharma', email: 'nina.sharma@company.com' },
  { name: 'Tom Martinez', email: 'tom.martinez@company.com' },
  { name: 'Olivia Lee', email: 'olivia.lee@company.com' },
];

function pickAttendees(seed: number, count: number): Attendee[] {
  const result: Attendee[] = [{ name: 'You', email: 'me@company.com', self: true, organizer: false, status: 'accepted' }];
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 7) % SAMPLE_PEOPLE.length;
    const p = SAMPLE_PEOPLE[idx]!;
    result.push({ name: p.name, email: p.email, self: false, organizer: i === 0, status: 'accepted' });
  }
  return result;
}

function generateSampleEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const templates = [
    { summary: 'Daily Stand-up', hour: 9, duration: 15, category: 'meeting' as const, freq: 'daily', attendeeCount: 5 },
    { summary: 'Sprint Planning', hour: 10, duration: 60, category: 'meeting' as const, freq: 'biweekly', attendeeCount: 8 },
    { summary: 'Team Sync', hour: 14, duration: 30, category: 'meeting' as const, freq: 'weekly', attendeeCount: 4 },
    { summary: '1:1 with Manager', hour: 11, duration: 30, category: 'meeting' as const, freq: 'weekly', attendeeCount: 1 },
    { summary: 'Code Review Session', hour: 15, duration: 45, category: 'focus' as const, freq: 'triweekly', attendeeCount: 2 },
    { summary: 'Deep Work Block', hour: 10, duration: 120, category: 'focus' as const, freq: 'daily', attendeeCount: 0 },
    { summary: 'Design Review', hour: 13, duration: 45, category: 'meeting' as const, freq: 'weekly', attendeeCount: 3 },
    { summary: 'Sprint Retro', hour: 16, duration: 60, category: 'meeting' as const, freq: 'biweekly', attendeeCount: 7 },
    { summary: 'Lunch with Team', hour: 12, duration: 60, category: 'social' as const, freq: 'weekly', attendeeCount: 3 },
    { summary: 'Coffee Chat', hour: 15, duration: 30, category: 'social' as const, freq: 'biweekly', attendeeCount: 1 },
    { summary: 'All Hands Meeting', hour: 11, duration: 60, category: 'meeting' as const, freq: 'monthly', attendeeCount: 11 },
    { summary: 'Training Session', hour: 14, duration: 90, category: 'admin' as const, freq: 'monthly', attendeeCount: 6 },
    { summary: 'Expense Report', hour: 16, duration: 30, category: 'admin' as const, freq: 'monthly', attendeeCount: 0 },
    { summary: 'Brainstorm Session', hour: 10, duration: 60, category: 'meeting' as const, freq: 'biweekly', attendeeCount: 4 },
    { summary: 'Product Demo', hour: 15, duration: 45, category: 'meeting' as const, freq: 'biweekly', attendeeCount: 9 },
    { summary: 'Writing Documentation', hour: 14, duration: 60, category: 'focus' as const, freq: 'weekly', attendeeCount: 0 },
    { summary: 'Interview - Candidate', hour: 11, duration: 60, category: 'meeting' as const, freq: 'triweekly', attendeeCount: 2 },
    { summary: 'Happy Hour', hour: 17, duration: 60, category: 'social' as const, freq: 'monthly', attendeeCount: 8 },
    { summary: 'Research Time', hour: 9, duration: 90, category: 'focus' as const, freq: 'biweekly', attendeeCount: 0 },
    { summary: 'Cross-team Sync', hour: 13, duration: 30, category: 'meeting' as const, freq: 'weekly', attendeeCount: 5 },
  ];

  function hashStr(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  for (let weekOffset = -8; weekOffset <= 0; weekOffset++) {
    for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
      const day = new Date(baseDate);
      day.setDate(day.getDate() + weekOffset * 7 + dayOfWeek - baseDate.getDay() + 1);
      if (day > now) continue;

      for (const template of templates) {
        let shouldAdd = false;
        const weekNum = Math.abs(weekOffset);
        switch (template.freq) {
          case 'daily': shouldAdd = true; break;
          case 'weekly': shouldAdd = dayOfWeek === hashStr(template.summary) % 5; break;
          case 'biweekly': shouldAdd = weekNum % 2 === 0 && dayOfWeek === hashStr(template.summary) % 5; break;
          case 'triweekly': shouldAdd = weekNum % 3 === 0 && dayOfWeek === hashStr(template.summary) % 5; break;
          case 'monthly': shouldAdd = weekNum % 4 === 0 && dayOfWeek === hashStr(template.summary) % 5; break;
        }

        if (shouldAdd) {
          const variance = (hashStr(template.summary + day.toISOString()) % 20) - 10;
          const startMin = Math.max(0, Math.min(55, variance > 0 ? variance : 0));
          const start = new Date(day);
          start.setHours(template.hour, startMin, 0, 0);
          const end = new Date(start.getTime() + template.duration * 60000);
          const attendees = template.attendeeCount > 0
            ? pickAttendees(hashStr(template.summary) + weekOffset, template.attendeeCount)
            : [];
          events.push({
            summary: template.summary, start, end,
            durationMin: template.duration, allDay: false,
            description: '', location: '', categories: [],
            status: 'CONFIRMED', category: template.category,
            attendees,
            attendeeCount: attendees.length,
            organizer: null,
          });
        }
      }
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export default function App() {
  const { user, loading: authLoading, accessToken, isConfigured, signIn, signOut, isTokenExpired } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { calendars, events, loading: calLoading, error, loadCalendars, loadEvents, importICS, setEvents } = useCalendar();
  const { report, dateRange, setDateRange, resetDateRange } = useAnalytics(events);

  const [screen, setScreen] = useState<Screen>(() => events.length > 0 ? 'dashboard' : 'auth');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigate to picker after auth
  const handleSignIn = useCallback(async () => {
    await signIn();
  }, [signIn]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setScreen('auth');
  }, [signOut]);

  const handleSync = useCallback(async () => {
    if (!accessToken || isTokenExpired()) {
      await signIn();
      return;
    }
    await loadCalendars(accessToken);
    setScreen('picker');
  }, [accessToken, isTokenExpired, signIn, loadCalendars]);

  const handleAnalyze = useCallback(async (calendarIds: string[]) => {
    if (!accessToken) return;
    const loaded = await loadEvents(accessToken, calendarIds);
    if (loaded.length > 0) setScreen('dashboard');
  }, [accessToken, loadEvents]);

  const handleFileContent = useCallback((content: string) => {
    try {
      const parsed = importICS(content);
      if (parsed.length === 0) {
        alert('No events found in this file.');
        return;
      }
      setScreen('dashboard');
    } catch {
      alert('Error parsing file. Please ensure it\'s a valid .ics file.');
    }
  }, [importICS]);

  const handleSampleData = useCallback(() => {
    const sample = generateSampleEvents();
    setEvents(sample);
    setScreen('dashboard');
  }, [setEvents]);

  // Handle post-OAuth redirect
  if (!authLoading && user && accessToken && screen === 'auth') {
    if (events.length > 0) {
      setScreen('dashboard');
    } else {
      loadCalendars(accessToken);
      setScreen('picker');
    }
  }

  if (authLoading) {
    return (
      <div className="loading-overlay" style={{ display: 'flex' }}>
        <div className="loading-spinner" />
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar
        user={user}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onUpload={() => fileInputRef.current?.click()}
        onSync={handleSync}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".ics,.csv"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
              if (typeof ev.target?.result === 'string') handleFileContent(ev.target.result);
            };
            reader.readAsText(file);
          }
        }}
      />

      {screen === 'auth' && (
        <AuthScreen
          onSignIn={handleSignIn}
          onOfflineMode={() => setScreen('upload')}
          isConfigured={isConfigured}
        />
      )}

      {screen === 'picker' && (
        <CalendarPicker
          calendars={calendars}
          loading={calLoading}
          error={error}
          onAnalyze={handleAnalyze}
          onRetry={handleSync}
          onReAuth={async () => { await signOut(); await signIn(); }}
        />
      )}

      {screen === 'upload' && (
        <UploadScreen
          onFileContent={handleFileContent}
          onBack={() => setScreen('auth')}
          onSampleData={handleSampleData}
        />
      )}

      {screen === 'dashboard' && report && (
        <DashboardPage
          report={report}
          events={events}
          dateRange={dateRange}
          onDateRangeApply={setDateRange}
          onDateRangeReset={resetDateRange}
        />
      )}

      {calLoading && (
        <div className="loading-overlay" style={{ display: 'flex' }}>
          <div className="loading-spinner" />
          <div className="loading-text">Syncing your calendars...</div>
        </div>
      )}
    </>
  );
}
