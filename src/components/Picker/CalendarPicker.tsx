import { useState, useEffect } from 'react';
import type { GoogleCalendar } from '../../types/calendar';

interface CalendarPickerProps {
  calendars: GoogleCalendar[];
  loading: boolean;
  error: string | null;
  onAnalyze: (calendarIds: string[]) => void;
  onRetry: () => void;
  onReAuth: () => void;
}

export function CalendarPicker({ calendars, loading, error, onAnalyze, onRetry, onReAuth }: CalendarPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const primary = calendars.find(c => c.primary);
    if (primary) setSelected([primary.id]);
  }, [calendars]);

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  return (
    <div className="picker-screen">
      <div className="picker-container">
        <div className="picker-hero">
          <h2 className="picker-title">Choose your calendars</h2>
          <p className="picker-subtitle">Select which calendars to analyze</p>
        </div>

        <div className="picker-list">
          {loading && <div className="picker-loading">Loading calendars...</div>}

          {error && (
            <div className="picker-loading" style={{ lineHeight: '1.7' }}>
              <p style={{ marginBottom: 12 }}><strong>Could not load calendars</strong></p>
              <p style={{ fontSize: '0.8125rem', maxWidth: 360, margin: '0 auto 16px' }}>{error}</p>
              <button className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={onReAuth}>Re-sign in</button>
            </div>
          )}

          {!loading && !error && calendars.map(cal => (
            <div
              key={cal.id}
              className={`picker-item${selected.includes(cal.id) ? ' selected' : ''}`}
              onClick={() => toggle(cal.id)}
              role="checkbox"
              aria-checked={selected.includes(cal.id)}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(cal.id); } }}
            >
              <div className="picker-check">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="picker-color" style={{ background: cal.color || 'var(--accent)' }} />
              <div className="picker-info">
                <span className="picker-name">
                  {cal.name}
                  {cal.primary && <span className="picker-primary-badge">Primary</span>}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && calendars.length > 0 && (
          <button
            className="btn btn-primary"
            disabled={selected.length === 0}
            onClick={() => onAnalyze(selected)}
          >
            Analyze Selected
          </button>
        )}
      </div>
    </div>
  );
}
