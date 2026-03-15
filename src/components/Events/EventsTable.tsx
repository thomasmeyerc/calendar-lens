import type { CalendarEvent } from '../../types/calendar';

interface EventsTableProps {
  events: CalendarEvent[];
  totalCount: number;
}

function formatAttendees(event: CalendarEvent): string {
  if (!event.attendees || event.attendees.length === 0) return '-';
  const others = event.attendees.filter(a => !a.self);
  if (others.length === 0) return 'Just you';
  const names = others.slice(0, 3).map(a => (a.name || a.email).split(' ')[0] ?? a.email.split('@')[0]);
  let text = names.join(', ');
  if (others.length > 3) text += ` +${others.length - 3}`;
  return text;
}

function formatDuration(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  if (event.durationMin >= 60) {
    const hours = Math.floor(event.durationMin / 60);
    const mins = event.durationMin % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${event.durationMin}m`;
}

export function EventsTable({ events, totalCount }: EventsTableProps) {
  return (
    <div className="chart-card chart-card-wide" style={{ animationDelay: '0.35s' }}>
      <div className="chart-header">
        <h3 className="chart-title">Recent Events</h3>
        <span className="chart-badge">{totalCount} events</span>
      </div>
      <div className="table-wrapper">
        <table className="events-table">
          <caption className="sr-only">Recent calendar events</caption>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Attendees</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <tr key={`${event.summary}-${event.start.toISOString()}-${i}`}>
                <td>{event.summary}</td>
                <td>{event.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                <td>{formatDuration(event)}</td>
                <td>{formatAttendees(event)}</td>
                <td>
                  <span className={`category-dot cat-${event.category}`}>
                    {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
