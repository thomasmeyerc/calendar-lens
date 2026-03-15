import { useState, useRef, useEffect } from 'react';
import type { CalendarEvent } from '../../types/calendar';
import { exportCSV, exportJSON } from '../../services/exportService';

interface ExportButtonProps {
  events: CalendarEvent[];
}

export function ExportButton({ events }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="btn btn-secondary btn-sm" onClick={() => setOpen(!open)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>
      {open && (
        <div className="user-dropdown open" style={{ right: 0, top: 'calc(100% + 4px)', width: 160 }}>
          <button className="user-dropdown-item" onClick={() => { exportCSV(events); setOpen(false); }}>Export CSV</button>
          <button className="user-dropdown-item" onClick={() => { exportJSON(events); setOpen(false); }}>Export JSON</button>
        </div>
      )}
    </div>
  );
}
