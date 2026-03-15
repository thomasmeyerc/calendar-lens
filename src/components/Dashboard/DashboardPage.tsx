import type { AnalyticsReport, CalendarEvent } from '../../types/calendar';
import { StatsRow } from './StatsRow';
import { DateRangePicker } from './DateRangePicker';
import { ExportButton } from './ExportButton';
import { TimeAllocation } from '../Charts/TimeAllocation';
import { DailyBreakdown } from '../Charts/DailyBreakdown';
import { BusyHeatmap } from '../Charts/BusyHeatmap';
import { WeeklyTrend } from '../Charts/WeeklyTrend';
import { DurationDistribution } from '../Charts/DurationDistribution';
import { EventsTable } from '../Events/EventsTable';
import { TimeInsights } from './TimeInsights';

interface DashboardPageProps {
  report: AnalyticsReport;
  events: CalendarEvent[];
  dateRange: { from: string; to: string } | null;
  onDateRangeApply: (range: { from: string; to: string }) => void;
  onDateRangeReset: () => void;
}

export function DashboardPage({ report, events, dateRange, onDateRangeApply, onDateRangeReset }: DashboardPageProps) {
  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
        <DateRangePicker dateRange={dateRange} onApply={onDateRangeApply} onReset={onDateRangeReset} />
        <ExportButton events={events} />
      </div>

      <StatsRow summary={report.summary} />

      <TimeInsights insights={report.insights} />

      <div className="charts-grid">
        <TimeAllocation data={report.categoryBreakdown} />
        <DailyBreakdown data={report.dailyHours} />
        <BusyHeatmap data={report.heatmap} />
        <WeeklyTrend data={report.weeklyTrend} />
        <DurationDistribution data={report.durationDistribution} />
      </div>

      <EventsTable events={report.recentEvents} totalCount={report.summary.totalEvents} />
    </div>
  );
}
