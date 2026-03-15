import { Bar } from 'react-chartjs-2';
import type { DurationBucket } from '../../types/calendar';
import { tooltipStyle, gridColor, CHART_BG, CHART_COLORS } from './chartConfig';

interface DurationDistributionProps {
  data: DurationBucket[];
}

export function DurationDistribution({ data }: DurationDistributionProps) {
  return (
    <div className="chart-card" style={{ animationDelay: '0.3s' }}>
      <div className="chart-header">
        <h3 className="chart-title">Duration Distribution</h3>
        <span className="chart-badge">event lengths</span>
      </div>
      <div className="chart-body">
        <Bar
          data={{
            labels: data.map(d => d.label),
            datasets: [{
              label: 'Events',
              data: data.map(d => d.count),
              backgroundColor: CHART_BG.slice(0, data.length),
              borderColor: CHART_COLORS.slice(0, data.length),
              borderWidth: 1,
              borderRadius: 6,
              borderSkipped: false,
            }],
          }}
          options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { ...tooltipStyle(), callbacks: { label: ctx => ` ${ctx.raw} events` } },
            },
            scales: {
              x: { grid: { color: gridColor() }, ticks: { font: { size: 11 } }, border: { display: false }, beginAtZero: true },
              y: { grid: { display: false }, ticks: { font: { size: 12, weight: 500 } }, border: { display: false } },
            },
            animation: { duration: 800, easing: 'easeOutQuart' },
          }}
        />
      </div>
    </div>
  );
}
