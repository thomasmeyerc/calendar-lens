import type { HeatmapData } from '../../types/calendar';

interface BusyHeatmapProps {
  data: HeatmapData;
}

export function BusyHeatmap({ data }: BusyHeatmapProps) {
  const { grid, maxValue, days } = data;

  function getCellStyle(val: number): React.CSSProperties {
    if (val === 0) return {};
    const intensity = val / maxValue;
    const alpha = 0.15 + intensity * 0.75;
    let bg: string;
    if (intensity < 0.5) bg = `rgba(129, 140, 248, ${alpha})`;
    else if (intensity < 0.8) bg = `rgba(192, 132, 252, ${alpha})`;
    else bg = `rgba(251, 113, 133, ${alpha})`;
    return { background: bg };
  }

  return (
    <div className="chart-card chart-card-wide" style={{ animationDelay: '0.2s' }}>
      <div className="chart-header">
        <h3 className="chart-title">Busy Hours</h3>
        <span className="chart-badge">heatmap</span>
      </div>
      <div className="chart-body" style={{ height: 'auto', padding: 'var(--space-md) var(--space-lg) var(--space-lg)' }}>
        <div className="heatmap-container" role="grid" aria-label="Weekly busy hours heatmap">
          {/* Header row */}
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={`h-${h}`} className="heatmap-hour-label">{h % 3 === 0 ? `${h}:00` : ''}</div>
          ))}

          {/* Data rows */}
          {grid.map((row, d) => (
            <div key={`row-${d}`} style={{ display: 'contents' }}>
              <div className="heatmap-label">{days[d]}</div>
              {row.map((val, h) => (
                <div
                  key={`${d}-${h}`}
                  className="heatmap-cell"
                  style={getCellStyle(val)}
                  data-tooltip={`${days[d]} ${h}:00 — ${val} event${val !== 1 ? 's' : ''}`}
                  role="gridcell"
                  aria-label={`${days[d]} ${h}:00, ${val} event${val !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
