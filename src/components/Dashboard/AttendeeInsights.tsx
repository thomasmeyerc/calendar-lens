import { useRef, useEffect } from 'react';
import type { AttendeeInsights as AttendeeInsightsData } from '../../types/calendar';
import Chart from 'chart.js/auto';
import { tooltipStyle, gridColor, CHART_BG, CHART_COLORS } from '../Charts/chartConfig';

interface AttendeeInsightsProps {
  data: AttendeeInsightsData;
}

const EXTENDED_BG = [
  ...CHART_BG,
  'rgba(52,211,153,0.8)', 'rgba(244,114,182,0.8)', 'rgba(167,139,250,0.8)',
  'rgba(56,189,248,0.8)',
];

const EXTENDED_BORDERS = [
  ...CHART_COLORS,
  '#34d399', '#f472b6', '#a78bfa', '#38bdf8',
];

export function AttendeeInsights({ data }: AttendeeInsightsProps) {
  const collabRef = useRef<HTMLCanvasElement>(null);
  const sizesRef = useRef<HTMLCanvasElement>(null);
  const collabChart = useRef<Chart | null>(null);
  const sizesChart = useRef<Chart | null>(null);

  useEffect(() => {
    // Top Collaborators chart
    if (collabRef.current && data.topCollaborators.length > 0) {
      collabChart.current?.destroy();
      collabChart.current = new Chart(collabRef.current, {
        type: 'bar',
        data: {
          labels: data.topCollaborators.map(c => {
            const name = c.name || c.email;
            return name.length > 20 ? name.substring(0, 18) + '...' : name;
          }),
          datasets: [{
            label: 'Meetings',
            data: data.topCollaborators.map(c => c.count),
            backgroundColor: EXTENDED_BG.slice(0, data.topCollaborators.length),
            borderColor: EXTENDED_BORDERS.slice(0, data.topCollaborators.length),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipStyle(),
              callbacks: {
                title: (items) => {
                  const idx = items[0]!.dataIndex;
                  const c = data.topCollaborators[idx]!;
                  return c.name || c.email;
                },
                label: (ctx) => {
                  const c = data.topCollaborators[ctx.dataIndex]!;
                  return [
                    ` ${c.count} meeting${c.count !== 1 ? 's' : ''}`,
                    ` ${c.totalHours}h total time`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              grid: { color: gridColor() },
              ticks: { font: { size: 11 }, stepSize: 1, callback: (v) => Number.isInteger(v) ? String(v) : '' },
              border: { display: false },
              beginAtZero: true,
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 11, weight: 500 as const } },
              border: { display: false },
            },
          },
          animation: { duration: 800, easing: 'easeOutQuart' },
        },
      });
    }

    // Meeting Sizes chart
    if (sizesRef.current) {
      const nonEmpty = data.meetingSizeDistribution.filter(b => b.count > 0);
      sizesChart.current?.destroy();
      if (nonEmpty.length > 0) {
        sizesChart.current = new Chart(sizesRef.current, {
          type: 'doughnut',
          data: {
            labels: nonEmpty.map(b => b.label),
            datasets: [{
              data: nonEmpty.map(b => b.count),
              backgroundColor: ['rgba(45,212,191,0.8)', 'rgba(129,140,248,0.8)', 'rgba(251,191,36,0.8)', 'rgba(251,113,133,0.8)'].slice(0, nonEmpty.length),
              borderColor: ['#2dd4bf', '#818cf8', '#fbbf24', '#fb7185'].slice(0, nonEmpty.length),
              borderWidth: 2,
              hoverBorderWidth: 3,
              hoverOffset: 8,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
              legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
              tooltip: {
                ...tooltipStyle(),
                callbacks: {
                  label: (ctx) => {
                    const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                    const pct = Math.round((ctx.raw as number / total) * 100);
                    return ` ${ctx.label}: ${ctx.raw} meeting${ctx.raw !== 1 ? 's' : ''} (${pct}%)`;
                  },
                },
              },
            },
            animation: { animateRotate: true, animateScale: true, duration: 1000, easing: 'easeOutQuart' },
          },
        });
      }
    }

    return () => {
      collabChart.current?.destroy();
      sizesChart.current?.destroy();
    };
  }, [data]);

  const hasData = data.meetingsWithAttendees > 0;

  return (
    <>
      {/* Attendee Stats */}
      <div className="attendee-stats-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon-emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{data.uniquePeople}</span>
            <span className="stat-label">Unique People</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{data.avgAttendees}</span>
            <span className="stat-label">Avg Attendees</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid charts-grid-attendees">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Top Collaborators</h3>
            <span className="chart-badge">Who you meet with</span>
          </div>
          <div className="chart-body chart-body-tall">
            {hasData ? <canvas ref={collabRef} /> : <p className="chart-empty-msg">No attendee data available</p>}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Meeting Sizes</h3>
            <span className="chart-badge">Participants per meeting</span>
          </div>
          <div className="chart-body chart-body-pie">
            {hasData ? <canvas ref={sizesRef} /> : <p className="chart-empty-msg">No attendee data available</p>}
          </div>
        </div>
      </div>
    </>
  );
}
