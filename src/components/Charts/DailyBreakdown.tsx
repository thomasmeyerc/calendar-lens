import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import type { DailyHours } from '../../types/calendar';
import { tooltipStyle, gridColor } from './chartConfig';

interface DailyBreakdownProps {
  data: DailyHours[];
}

export function DailyBreakdown({ data }: DailyBreakdownProps) {
  const [slice, setSlice] = useState<'week' | 'month'>('week');
  const sliced = slice === 'week' ? data.slice(-7) : data.slice(-30);

  return (
    <div className="chart-card" style={{ animationDelay: '0.15s' }}>
      <div className="chart-header">
        <h3 className="chart-title">Daily Breakdown</h3>
        <div className="chart-controls">
          <button className={`chart-control-btn${slice === 'week' ? ' active' : ''}`} onClick={() => setSlice('week')}>Week</button>
          <button className={`chart-control-btn${slice === 'month' ? ' active' : ''}`} onClick={() => setSlice('month')}>Month</button>
        </div>
      </div>
      <div className="chart-body">
        <Bar
          data={{
            labels: sliced.map(d => d.label),
            datasets: [{
              label: 'Hours',
              data: sliced.map(d => d.hours),
              backgroundColor: 'rgba(129, 140, 248, 0.8)',
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 40,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { ...tooltipStyle(), callbacks: { label: ctx => ` ${ctx.raw} hours` } },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 0 }, border: { display: false } },
              y: { grid: { color: gridColor() }, ticks: { font: { size: 11 }, callback: v => v + 'h' }, border: { display: false }, beginAtZero: true },
            },
            animation: { duration: 800, easing: 'easeOutQuart' },
          }}
        />
      </div>
    </div>
  );
}
