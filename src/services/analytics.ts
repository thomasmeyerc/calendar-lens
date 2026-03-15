import type {
  CalendarEvent,
  AnalyticsReport,
  ReportSummary,
  CategoryBreakdown,
  DailyHours,
  WeeklyTrend,
  HeatmapData,
  DurationBucket,
  EventCategory,
  Insight,
  AttendeeInsights,
  Collaborator,
  MeetingSizeBucket,
} from '../types/calendar';
import { APP_CONFIG } from '../types/calendar';

export function generateReport(events: CalendarEvent[]): AnalyticsReport {
  // Filter out events with invalid dates
  const validEvents = events.filter(
    e => e && e.start instanceof Date && !isNaN(e.start.getTime()) &&
      (e.allDay || (e.end instanceof Date && !isNaN(e.end.getTime())))
  );
  const timedEvents = validEvents.filter(e => !e.allDay);

  return {
    summary: computeSummary(validEvents, timedEvents),
    categoryBreakdown: computeCategoryBreakdown(timedEvents),
    dailyHours: computeDailyHours(timedEvents),
    weeklyTrend: computeWeeklyTrend(timedEvents),
    heatmap: computeHeatmap(timedEvents),
    durationDistribution: computeDurationDistribution(timedEvents),
    insights: generateInsights(validEvents, timedEvents),
    attendeeInsights: computeAttendeeInsights(timedEvents),
    recentEvents: getRecentEvents(validEvents, APP_CONFIG.maxEventsDisplay),
    dateRange: getDateRange(validEvents),
  };
}

function computeSummary(allEvents: CalendarEvent[], timedEvents: CalendarEvent[]): ReportSummary {
  const totalEvents = allEvents.length;
  const totalMinutes = timedEvents.reduce((sum, e) => sum + e.durationMin, 0);
  const totalHours = totalMinutes / 60;
  const avgDurationMin = timedEvents.length > 0
    ? Math.round(totalMinutes / timedEvents.length)
    : 0;

  const range = getDateRange(allEvents);
  const daySpan = Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)));
  const weekSpan = Math.max(1, daySpan / 7);
  const weeklyMeetingHours = totalHours / weekSpan;
  const meetingLoad = Math.min(100, Math.round((weeklyMeetingHours / APP_CONFIG.workHoursPerWeek) * 100));

  return {
    totalEvents,
    totalHours: Math.round(totalHours * 10) / 10,
    avgDurationMin,
    meetingLoad,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  meeting: 'Meetings',
  focus: 'Focus Time',
  social: 'Social',
  admin: 'Admin',
  other: 'Other',
};

function formatCategoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function computeCategoryBreakdown(events: CalendarEvent[]): CategoryBreakdown[] {
  const categories: Record<string, CategoryBreakdown> = {};
  for (const event of events) {
    const cat = event.category || 'other';
    if (!categories[cat]) {
      categories[cat] = { label: formatCategoryLabel(cat), minutes: 0, count: 0, hours: 0, key: cat as EventCategory };
    }
    categories[cat].minutes += event.durationMin;
    categories[cat].count += 1;
  }

  return Object.values(categories)
    .map(c => ({ ...c, hours: Math.round(c.minutes / 6) / 10 }))
    .sort((a, b) => b.minutes - a.minutes);
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function computeDailyHours(events: CalendarEvent[]): DailyHours[] {
  const days: Record<string, DailyHours> = {};
  for (const event of events) {
    const dayKey = formatDateKey(event.start);
    if (!days[dayKey]) {
      days[dayKey] = { date: dayKey, minutes: 0, label: formatDayLabel(event.start), hours: 0 };
    }
    days[dayKey].minutes += event.durationMin;
  }

  return Object.values(days)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, hours: Math.round(d.minutes / 6) / 10 }));
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return formatDateKey(d);
}

function computeWeeklyTrend(events: CalendarEvent[]): WeeklyTrend[] {
  const weeks: Record<string, WeeklyTrend> = {};
  for (const event of events) {
    const weekKey = getWeekKey(event.start);
    if (!weeks[weekKey]) {
      weeks[weekKey] = { week: weekKey, minutes: 0, label: weekKey, hours: 0 };
    }
    weeks[weekKey].minutes += event.durationMin;
  }

  return Object.values(weeks)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map(w => ({ ...w, hours: Math.round(w.minutes / 6) / 10 }));
}

function computeHeatmap(events: CalendarEvent[]): HeatmapData {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);

  for (const event of events) {
    const dayIdx = (event.start.getDay() + 6) % 7; // Mon=0, Sun=6
    const hour = event.start.getHours();
    const endHour = Math.min(23, hour + Math.ceil(event.durationMin / 60));
    for (let h = hour; h <= endHour; h++) {
      grid[dayIdx]![h]!++;
    }
  }

  return {
    grid,
    maxValue: Math.max(1, ...grid.flat()),
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  };
}

function computeDurationDistribution(events: CalendarEvent[]): DurationBucket[] {
  const buckets: DurationBucket[] = [
    { label: '< 15m', min: 0, max: 15, count: 0 },
    { label: '15-30m', min: 15, max: 30, count: 0 },
    { label: '30-60m', min: 30, max: 60, count: 0 },
    { label: '1-2h', min: 60, max: 120, count: 0 },
    { label: '2-4h', min: 120, max: 240, count: 0 },
    { label: '4h+', min: 240, max: Infinity, count: 0 },
  ];

  for (const event of events) {
    for (const bucket of buckets) {
      if (event.durationMin >= bucket.min && event.durationMin < bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets;
}

function getRecentEvents(events: CalendarEvent[], n: number): CalendarEvent[] {
  return [...events]
    .sort((a, b) => b.start.getTime() - a.start.getTime())
    .slice(0, n);
}

function getDateRange(events: CalendarEvent[]): { start: Date; end: Date } {
  if (events.length === 0) return { start: new Date(), end: new Date() };
  const start = new Date(Math.min(...events.map(e => e.start.getTime())));
  // BUG FIX: use e.end instead of e.start for end bound
  const end = new Date(Math.max(...events.map(e => (e.end || e.start).getTime())));
  return { start, end };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function generateInsights(_allEvents: CalendarEvent[], timedEvents: CalendarEvent[]): Insight[] {
  const insights: Insight[] = [];
  if (timedEvents.length === 0) return insights;

  // 1. Busiest day of the week
  const dayTotals = Array(7).fill(0) as number[];
  for (const e of timedEvents) {
    dayTotals[e.start.getDay()]! += e.durationMin;
  }
  const weeks = Math.max(1, new Set(timedEvents.map(e => getWeekKey(e.start))).size);
  const avgPerDay = dayTotals.map(t => t / weeks);
  const busiestDayIdx = avgPerDay.indexOf(Math.max(...avgPerDay));
  const busiestHours = Math.round(avgPerDay[busiestDayIdx]! / 6) / 10;
  insights.push({
    icon: 'calendar',
    color: 'indigo',
    text: `${DAY_NAMES[busiestDayIdx]} is your busiest day, averaging ${busiestHours} hours of scheduled time per week.`,
  });

  // 2. Meeting vs focus ratio
  const totalScheduled = timedEvents.reduce((s, e) => s + e.durationMin, 0);
  const meetingMin = timedEvents.filter(e => e.category === 'meeting').reduce((s, e) => s + e.durationMin, 0);
  const focusMin = timedEvents.filter(e => e.category === 'focus').reduce((s, e) => s + e.durationMin, 0);
  const meetingPct = Math.round((meetingMin / totalScheduled) * 100);
  if (focusMin > 0) {
    const ratio = Math.round((meetingMin / focusMin) * 10) / 10;
    insights.push({
      icon: 'clock',
      color: 'blue',
      text: `You spend ${meetingPct}% of your scheduled time in meetings, with a ${ratio}:1 meeting-to-focus ratio — ${ratio > 2 ? 'consider blocking more deep work slots' : 'a healthy balance'}.`,
    });
  } else {
    insights.push({
      icon: 'clock',
      color: 'blue',
      text: `Meetings account for ${meetingPct}% of your calendar — no explicit focus time blocked yet.`,
    });
  }

  // 3. Peak hour analysis
  const hourBuckets = Array(24).fill(0) as number[];
  for (const e of timedEvents) {
    hourBuckets[e.start.getHours()]! += e.durationMin;
  }
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));
  const peakLabel = peakHour < 12 ? `${peakHour === 0 ? 12 : peakHour} AM` : `${peakHour === 12 ? 12 : peakHour - 12} PM`;
  const morningMin = hourBuckets.slice(6, 12).reduce((a, b) => a + b, 0);
  const afternoonMin = hourBuckets.slice(12, 18).reduce((a, b) => a + b, 0);
  const timeOfDay = morningMin > afternoonMin ? 'morning person' : 'afternoon person';
  insights.push({
    icon: 'zap',
    color: 'teal',
    text: `Your calendar peaks at ${peakLabel} — you're a ${timeOfDay}, with ${Math.round(Math.max(morningMin, afternoonMin) / 60)} hours packed into your ${morningMin > afternoonMin ? 'mornings' : 'afternoons'}.`,
  });

  // 4. Most recurring event
  const eventCounts: Record<string, { count: number; original: string; totalMin: number }> = {};
  for (const e of timedEvents) {
    const name = e.summary.toLowerCase().trim();
    if (!eventCounts[name]) {
      eventCounts[name] = { count: 0, original: e.summary, totalMin: 0 };
    }
    eventCounts[name].count++;
    eventCounts[name].totalMin += e.durationMin;
  }
  const sorted = Object.values(eventCounts).sort((a, b) => b.count - a.count);
  if (sorted.length > 0 && sorted[0]!.count > 1) {
    const top = sorted[0]!;
    const totalHrs = Math.round(top.totalMin / 6) / 10;
    insights.push({
      icon: 'repeat',
      color: 'rose',
      text: `"${top.original}" is your most recurring event, appearing ${top.count} times and consuming ${totalHrs} hours total — ${Math.round((top.totalMin / totalScheduled) * 100)}% of scheduled time.`,
    });
  } else {
    insights.push({
      icon: 'repeat',
      color: 'rose',
      text: `Your calendar is highly varied — no single event repeats more than once.`,
    });
  }

  // 5. Lightest day + free time potential
  const nonZeroDays = avgPerDay.filter(d => d > 0);
  const lightestDayIdx = nonZeroDays.length > 0
    ? avgPerDay.indexOf(Math.min(...nonZeroDays))
    : avgPerDay.indexOf(0);
  const lightestHours = Math.round(avgPerDay[lightestDayIdx]! / 6) / 10;
  const avgDailyHours = Math.round(avgPerDay.reduce((a, b) => a + b, 0) / 7 / 6) / 10;
  if (lightestHours === 0) {
    insights.push({
      icon: 'sun',
      color: 'amber',
      text: `${DAY_NAMES[lightestDayIdx]} is completely free — across other days you average ${avgDailyHours} hours of commitments.`,
    });
  } else {
    insights.push({
      icon: 'sun',
      color: 'amber',
      text: `${DAY_NAMES[lightestDayIdx]} is your lightest day at ${lightestHours} hours — ${Math.round((1 - lightestHours / busiestHours) * 100)}% less than ${DAY_NAMES[busiestDayIdx]}, ideal for deep work.`,
    });
  }

  return insights;
}

function computeAttendeeInsights(events: CalendarEvent[]): AttendeeInsights {
  const eventsWithAttendees = events.filter(e => e.attendees && e.attendees.length > 0);
  const collaborators: Record<string, Omit<Collaborator, 'totalHours'>> = {};
  let totalAttendees = 0;

  const sizeBuckets: MeetingSizeBucket[] = [
    { label: '1:1', min: 2, max: 2, count: 0, minutes: 0 },
    { label: 'Small (3-5)', min: 3, max: 5, count: 0, minutes: 0 },
    { label: 'Medium (6-10)', min: 6, max: 10, count: 0, minutes: 0 },
    { label: 'Large (11+)', min: 11, max: Infinity, count: 0, minutes: 0 },
  ];

  for (const event of eventsWithAttendees) {
    const attendeeCount = event.attendees!.length;
    totalAttendees += attendeeCount;

    for (const att of event.attendees!) {
      if (att.self) continue;
      const key = att.email || att.name;
      if (!collaborators[key]) {
        collaborators[key] = { name: att.name, email: att.email, count: 0, totalMinutes: 0 };
      }
      collaborators[key].count += 1;
      collaborators[key].totalMinutes += event.durationMin;
    }

    for (const bucket of sizeBuckets) {
      if (attendeeCount >= bucket.min && attendeeCount <= bucket.max) {
        bucket.count += 1;
        bucket.minutes += event.durationMin;
        break;
      }
    }
  }

  const topCollaborators: Collaborator[] = Object.values(collaborators)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(c => ({ ...c, totalHours: Math.round(c.totalMinutes / 6) / 10 }));

  const uniquePeople = Object.keys(collaborators).length;
  const avgAttendees = eventsWithAttendees.length > 0
    ? Math.round((totalAttendees / eventsWithAttendees.length) * 10) / 10
    : 0;

  return {
    topCollaborators,
    meetingSizeDistribution: sizeBuckets,
    uniquePeople,
    avgAttendees,
    meetingsWithAttendees: eventsWithAttendees.length,
  };
}
