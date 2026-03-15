import { useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import type { TrendsReport, TrendChange } from '../../types/calendar';
import { COLORS, isDark, gridColor, tooltipStyle } from '../Charts/chartConfig';

interface TrendsSectionProps {
  trends: TrendsReport;
}

function computeLinearTrend(values: number[]): number[] {
  const n = values.length;
  if (n < 2) return values;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i]!;
    sumXY += i * values[i]!;
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return values.map((_, i) => Math.round((slope * i + intercept) * 10) / 10);
}

function ChangeChip({ change, polarity }: { change: TrendChange; polarity: 'bad' | 'neutral' }) {
  if (change.direction === 'stable') {
    return <span className="trend-change trend-stable">Stable</span>;
  }

  const arrow = change.direction === 'up' ? '\u2191' : '\u2193';
  const text = `${arrow} ${change.percent}%`;

  if (polarity === 'bad') {
    const cls = change.direction === 'up' ? 'trend-change trend-up' : 'trend-change trend-down';
    return <span className={cls}>{text}</span>;
  }
  const cls = change.direction === 'up' ? 'trend-change trend-up-good' : 'trend-change trend-down-bad';
  return <span className={cls}>{text}</span>;
}

export function TrendsSection({ trends }: TrendsSectionProps) {
  const meetingChartData = useMemo(() => {
    const labels = trends.weeklyMeetingCounts.map(w => w.label);
    const meetingCounts = trends.weeklyMeetingCounts.map(w => w.count);
    const totalCounts = trends.weeklyMeetingCounts.map(w => w.total);
    const trendLine = computeLinearTrend(meetingCounts);

    return {
      labels,
      datasets: [
        {
          label: 'Meetings',
          data: meetingCounts,
          backgroundColor: 'rgba(129, 140, 248, 0.7)',
          borderColor: '#818cf8',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false as const,
          maxBarThickness: 40,
          order: 2,
        },
        {
          label: 'All events',
          data: totalCounts,
          backgroundColor: 'rgba(96, 165, 250, 0.25)',
          borderColor: 'rgba(96, 165, 250, 0.5)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false as const,
          maxBarThickness: 40,
          order: 3,
        },
        {
          label: 'Trend',
          data: trendLine,
          type: 'line' as const,
          borderColor: '#fb7185',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 1,
        },
      ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }, [trends.weeklyMeetingCounts]);

  const categoryChartData = useMemo(() => {
    const labels = trends.weeklyCategoryHours.map(w => w.label);
    const categories = ['meeting', 'focus', 'social', 'admin', 'other'] as const;
    const catLabels: Record<string, string> = { meeting: 'Meetings', focus: 'Focus Time', social: 'Social', admin: 'Admin', other: 'Other' };

    const datasets = categories
      .filter(cat => trends.weeklyCategoryHours.some(w => (w[cat] || 0) > 0))
      .map(cat => ({
        label: catLabels[cat]!,
        data: trends.weeklyCategoryHours.map(w => w[cat] || 0),
        borderColor: COLORS[cat]?.border || '#60a5fa',
        backgroundColor: (COLORS[cat]?.bg || 'rgba(96,165,250,0.8)').replace('0.8', '0.15'),
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: COLORS[cat]?.border || '#60a5fa',
        pointBorderColor: isDark() ? '#0f0f1a' : '#ffffff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.35,
      }));

    return { labels, datasets };
  }, [trends.weeklyCategoryHours]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 16, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' as const } },
      tooltip: { ...tooltipStyle(), callbacks: { title: (items: { label: string }[]) => `Week of ${items[0]?.label}`, label: (ctx: { dataset: { label?: string }; raw: unknown }) => ` ${ctx.dataset.label ?? ''}: ${ctx.raw}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: gridColor(), drawBorder: false }, ticks: { font: { size: 11 }, stepSize: 1 }, border: { display: false }, beginAtZero: true },
    },
    animation: { duration: 800, easing: 'easeOutQuart' as const },
  }), []);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 16, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' as const } },
      tooltip: { ...tooltipStyle(), callbacks: { title: (items: { label: string }[]) => `Week of ${items[0]?.label}`, label: (ctx: { dataset: { label?: string }; raw: unknown }) => ` ${ctx.dataset.label ?? ''}: ${ctx.raw}h` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: gridColor(), drawBorder: false }, ticks: { font: { size: 11 }, callback: (v: string | number) => v + 'h' }, border: { display: false }, beginAtZero: true, stacked: false },
    },
    animation: { duration: 1000, easing: 'easeOutQuart' as const },
  }), []);

  if (trends.weekCount < 2) return null;

  return (
    <div className="trends-section">
      <div className="trends-header">
        <h2 className="trends-title">Trends & Insights</h2>
        <span className="chart-badge">{trends.weekCount} weeks analyzed</span>
      </div>

      <div className="trends-row">
        <div className="trend-card">
          <div className="trend-icon-wrap trend-icon-indigo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="trend-content">
            <span className="trend-label">Meetings / week</span>
            <div className="trend-value-row">
              <span className="trend-value">{trends.meetingCount.recent}</span>
              <ChangeChip change={trends.meetingCount} polarity="bad" />
            </div>
          </div>
        </div>

        <div className="trend-card">
          <div className="trend-icon-wrap trend-icon-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="trend-content">
            <span className="trend-label">Hours / week</span>
            <div className="trend-value-row">
              <span className="trend-value">{trends.totalHours.recent}h</span>
              <ChangeChip change={trends.totalHours} polarity="neutral" />
            </div>
          </div>
        </div>

        <div className="trend-card">
          <div className="trend-icon-wrap trend-icon-teal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div className="trend-content">
            <span className="trend-label">Avg duration</span>
            <div className="trend-value-row">
              <span className="trend-value">{Math.round(trends.avgDuration.recent)}m</span>
              <ChangeChip change={trends.avgDuration} polarity="neutral" />
            </div>
          </div>
        </div>

        <div className="trend-card">
          <div className="trend-icon-wrap trend-icon-rose">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div className="trend-content">
            <span className="trend-label">Busiest day</span>
            <div className="trend-value-row">
              <span className="trend-value">{trends.busiestDay}</span>
              <span className="trend-sub">{trends.busiestDayHours}h total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="trends-charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Meeting Frequency</h2>
            <span className="chart-badge">Meetings per week</span>
          </div>
          <div className="chart-body">
            <Bar data={meetingChartData} options={barOptions} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Category Trends</h2>
            <span className="chart-badge">Hours by category per week</span>
          </div>
          <div className="chart-body">
            <Line data={categoryChartData} options={lineOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
