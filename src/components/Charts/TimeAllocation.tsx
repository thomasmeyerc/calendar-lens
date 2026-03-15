import { Doughnut } from 'react-chartjs-2';
import type { CategoryBreakdown } from '../../types/calendar';
import { COLORS, tooltipStyle } from './chartConfig';

interface TimeAllocationProps {
  data: CategoryBreakdown[];
}

export function TimeAllocation({ data }: TimeAllocationProps) {
  const chartData = {
    labels: data.map(c => c.label),
    datasets: [{
      data: data.map(c => c.hours),
      backgroundColor: data.map(c => COLORS[c.key]?.bg ?? 'rgba(96,165,250,0.8)'),
      borderColor: data.map(c => COLORS[c.key]?.border ?? '#60a5fa'),
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverOffset: 8,
    }],
  };

  return (
    <div className="chart-card" style={{ animationDelay: '0.1s' }}>
      <div className="chart-header">
        <h3 className="chart-title">Time Allocation</h3>
        <span className="chart-badge">by category</span>
      </div>
      <div className="chart-body chart-body-pie">
        <Doughnut
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
              legend: { position: 'bottom', labels: { padding: 20, font: { size: 13 } } },
              tooltip: {
                ...tooltipStyle(),
                titleFont: { weight: 'bold' },
                callbacks: {
                  label: (ctx) => {
                    const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                    const pct = Math.round(((ctx.raw as number) / total) * 100);
                    return ` ${ctx.label}: ${ctx.raw}h (${pct}%)`;
                  },
                },
              },
            },
            animation: { animateRotate: true, animateScale: true, duration: 1000, easing: 'easeOutQuart' },
          }}
        />
      </div>
    </div>
  );
}
