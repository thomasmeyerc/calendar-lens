interface DateRangePickerProps {
  dateRange: { from: string; to: string } | null;
  onApply: (range: { from: string; to: string }) => void;
  onReset: () => void;
}

export function DateRangePicker({ dateRange, onApply, onReset }: DateRangePickerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
      <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        From:
        <input
          type="date"
          defaultValue={dateRange?.from ?? ''}
          id="date-from"
          style={{ marginLeft: 4, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-card-border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}
        />
      </label>
      <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        To:
        <input
          type="date"
          defaultValue={dateRange?.to ?? ''}
          id="date-to"
          style={{ marginLeft: 4, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-card-border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}
        />
      </label>
      <button
        className="btn btn-sm btn-primary"
        onClick={() => {
          const from = (document.getElementById('date-from') as HTMLInputElement)?.value;
          const to = (document.getElementById('date-to') as HTMLInputElement)?.value;
          if (from && to) onApply({ from, to });
        }}
      >
        Apply
      </button>
      {dateRange && (
        <button className="btn btn-sm btn-ghost" onClick={onReset}>Reset</button>
      )}
    </div>
  );
}
