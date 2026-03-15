import type { Insight } from '../../types/calendar';

const ICON_MAP: Record<string, string> = {
  calendar: '\u{1F4C5}',
  clock: '\u{1F551}',
  zap: '\u{26A1}',
  repeat: '\u{1F501}',
  sun: '\u{2600}\u{FE0F}',
};

interface TimeInsightsProps {
  insights: Insight[];
}

export function TimeInsights({ insights }: TimeInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <div className="insights-card">
      <h3 className="insights-title">Time Insights</h3>
      <ul className="insights-list">
        {insights.map((insight, i) => (
          <li key={i} className="insight-item">
            <span className={`insight-icon insight-icon-${insight.color}`}>
              {ICON_MAP[insight.icon] ?? ''}
            </span>
            <span className="insight-text">{insight.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
