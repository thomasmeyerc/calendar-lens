export type EventCategory = 'meeting' | 'focus' | 'social' | 'admin' | 'other';

export interface CalendarEvent {
  summary: string;
  start: Date;
  end: Date;
  durationMin: number;
  allDay: boolean;
  description: string;
  location: string;
  categories: string[];
  status: string;
  category: EventCategory;
}

export interface GoogleCalendar {
  id: string;
  name: string;
  primary: boolean;
  color: string;
}

export interface ReportSummary {
  totalEvents: number;
  totalHours: number;
  avgDurationMin: number;
  meetingLoad: number;
}

export interface CategoryBreakdown {
  label: string;
  minutes: number;
  count: number;
  hours: number;
  key: EventCategory;
}

export interface DailyHours {
  date: string;
  label: string;
  minutes: number;
  hours: number;
}

export interface WeeklyTrend {
  week: string;
  label: string;
  minutes: number;
  hours: number;
}

export interface HeatmapData {
  grid: number[][];
  maxValue: number;
  days: string[];
}

export interface DurationBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface AnalyticsReport {
  summary: ReportSummary;
  categoryBreakdown: CategoryBreakdown[];
  dailyHours: DailyHours[];
  weeklyTrend: WeeklyTrend[];
  heatmap: HeatmapData;
  durationDistribution: DurationBucket[];
  recentEvents: CalendarEvent[];
  dateRange: { start: Date; end: Date };
}

export interface AppConfig {
  maxEventsDisplay: number;
  defaultFetchDays: number;
  workHoursPerWeek: number;
  maxApiResults: number;
  statAnimationMs: number;
}

export const APP_CONFIG: AppConfig = {
  maxEventsDisplay: 25,
  defaultFetchDays: 60,
  workHoursPerWeek: 40,
  maxApiResults: 250,
  statAnimationMs: 600,
};
