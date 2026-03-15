import type { ReportSummary } from '../../types/calendar';
import { StatCard } from './StatCard';

interface StatsRowProps {
  summary: ReportSummary;
}

export function StatsRow({ summary }: StatsRowProps) {
  return (
    <div className="stats-row">
      <StatCard
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        iconClass="stat-icon-indigo"
        label="Total Events"
        value={summary.totalEvents}
        suffix=""
        delay={0.05}
      />
      <StatCard
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        iconClass="stat-icon-blue"
        label="Total Hours"
        value={summary.totalHours}
        suffix="h"
        delay={0.1}
      />
      <StatCard
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>}
        iconClass="stat-icon-teal"
        label="Avg Duration"
        value={summary.avgDurationMin}
        suffix="m"
        delay={0.15}
      />
      <StatCard
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        iconClass="stat-icon-rose"
        label="Meeting Load"
        value={summary.meetingLoad}
        suffix="%"
        delay={0.2}
      />
    </div>
  );
}
