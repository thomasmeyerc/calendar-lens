import { Line } from 'react-chartjs-2';
import type { WeeklyTrend as WeeklyTrendData } from '../../types/calendar';
import { tooltipStyle, gridColor, isDark } from './chartConfig';

interface WeeklyTrendProps {
  data: WeeklyTrendData[];
}

export function WeeklyTrend({ data }: WeeklyTrendProps) {
  return (
    <div className="chart-card" style={{ animationDelay: '0.25s' }}>
      <div className="chart-header">
        <h3 className="chart-title">Weekly Trend</h3>
        <span className="chart-badge">hours/week</span>
      </div>
      <div className="chart-body">
        <Line
          data={{
            labels: data.map(w => {
              const d = new Date(w.week);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
              label: 'Hours',
              data: data.map(w => w.hours),
              borderColor: '#818cf8',
              backgroundColor: 'rgba(129, 140, 248, 0.1)',
              borderWidth: 2.5,
              pointBackgroundColor: '#818cf8',
              pointBorderColor: isDark() ? '#0f0f1a' : '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              fill: true,
              tension: 0.4,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltipStyle(),
                callbacks: {
                  title: items => `Week of ${items[0]?.label ?? ''}`,
                  label: ctx => ` ${ctx.raw} hours`,
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 } }, border: { display: false } },
              y: { grid: { color: gridColor() }, ticks: { font: { size: 11 }, callback: v => v + 'h' }, border: { display: false }, beginAtZero: true },
            },
            animation: { duration: 1000, easing: 'easeOutQuart' },
          }}
        />
      </div>
    </div>
  );
}
