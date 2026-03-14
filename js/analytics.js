/**
 * analytics.js — Calendar Analytics Engine
 * Takes parsed events and computes insights, aggregations, and statistics.
 */

const CalendarAnalytics = (() => {

    /**
     * Generate a complete analytics report from an array of events.
     * @param {Array} events - Parsed event objects
     * @returns {Object} Full analytics report
     */
    function generateReport(events) {
        // Filter out all-day events for time-based calculations (they skew durations)
        const timedEvents = events.filter(e => !e.allDay);

        return {
            summary: computeSummary(events, timedEvents),
            categoryBreakdown: computeCategoryBreakdown(timedEvents),
            dailyHours: computeDailyHours(timedEvents),
            weeklyTrend: computeWeeklyTrend(timedEvents),
            heatmap: computeHeatmap(timedEvents),
            durationDistribution: computeDurationDistribution(timedEvents),
            recentEvents: getRecentEvents(events, 25),
            dateRange: getDateRange(events)
        };
    }

    /**
     * Compute high-level summary statistics.
     */
    function computeSummary(allEvents, timedEvents) {
        const totalEvents = allEvents.length;
        const totalMinutes = timedEvents.reduce((sum, e) => sum + e.durationMin, 0);
        const totalHours = totalMinutes / 60;
        const avgDurationMin = timedEvents.length > 0
            ? Math.round(totalMinutes / timedEvents.length)
            : 0;

        // Meeting load: % of working hours (8h/day, 5 days/week) spent in meetings
        const range = getDateRange(allEvents);
        const daySpan = Math.max(1, Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24)));
        const weekSpan = Math.max(1, daySpan / 7);
        const weeklyMeetingHours = totalHours / weekSpan;
        const meetingLoad = Math.min(100, Math.round((weeklyMeetingHours / 40) * 100));

        return {
            totalEvents,
            totalHours: Math.round(totalHours * 10) / 10,
            avgDurationMin,
            meetingLoad
        };
    }

    /**
     * Break down time by category.
     */
    function computeCategoryBreakdown(events) {
        const categories = {};
        for (const event of events) {
            const cat = event.category || 'other';
            if (!categories[cat]) {
                categories[cat] = { label: formatCategoryLabel(cat), minutes: 0, count: 0, key: cat };
            }
            categories[cat].minutes += event.durationMin;
            categories[cat].count += 1;
        }

        return Object.values(categories)
            .map(c => ({ ...c, hours: Math.round(c.minutes / 6) / 10 }))
            .sort((a, b) => b.minutes - a.minutes);
    }

    /**
     * Compute hours per day.
     */
    function computeDailyHours(events) {
        const days = {};
        for (const event of events) {
            const dayKey = formatDateKey(event.start);
            if (!days[dayKey]) {
                days[dayKey] = { date: dayKey, minutes: 0, label: formatDayLabel(event.start) };
            }
            days[dayKey].minutes += event.durationMin;
        }

        const sorted = Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
        return sorted.map(d => ({
            ...d,
            hours: Math.round(d.minutes / 6) / 10
        }));
    }

    /**
     * Compute total hours per week for trend analysis.
     */
    function computeWeeklyTrend(events) {
        const weeks = {};
        for (const event of events) {
            const weekKey = getWeekKey(event.start);
            if (!weeks[weekKey]) {
                weeks[weekKey] = { week: weekKey, minutes: 0, label: weekKey };
            }
            weeks[weekKey].minutes += event.durationMin;
        }

        return Object.values(weeks)
            .sort((a, b) => a.week.localeCompare(b.week))
            .map(w => ({
                ...w,
                hours: Math.round(w.minutes / 6) / 10
            }));
    }

    /**
     * Compute a heatmap grid: day of week × hour of day.
     * Returns a 7×24 matrix with event counts.
     */
    function computeHeatmap(events) {
        // 7 rows (Mon–Sun), 24 columns (0–23)
        const grid = Array.from({ length: 7 }, () => Array(24).fill(0));

        for (const event of events) {
            const dayIdx = (event.start.getDay() + 6) % 7; // Mon=0, Sun=6
            const hour = event.start.getHours();

            // Fill all hours the event spans
            const endHour = Math.min(23, hour + Math.ceil(event.durationMin / 60));
            for (let h = hour; h <= endHour; h++) {
                grid[dayIdx][h]++;
            }
        }

        return {
            grid,
            maxValue: Math.max(1, ...grid.flat()),
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        };
    }

    /**
     * Distribution of event durations in buckets.
     */
    function computeDurationDistribution(events) {
        const buckets = [
            { label: '< 15m', min: 0, max: 15, count: 0 },
            { label: '15-30m', min: 15, max: 30, count: 0 },
            { label: '30-60m', min: 30, max: 60, count: 0 },
            { label: '1-2h', min: 60, max: 120, count: 0 },
            { label: '2-4h', min: 120, max: 240, count: 0 },
            { label: '4h+', min: 240, max: Infinity, count: 0 }
        ];

        for (const event of events) {
            for (const bucket of buckets) {
                if (event.durationMin >= bucket.min && event.durationMin < bucket.max) {
                    bucket.count++;
                    break;
                }
            }
        }

        return buckets;
    }

    /**
     * Get the most recent N events sorted by start date (descending).
     */
    function getRecentEvents(events, n = 25) {
        return [...events]
            .sort((a, b) => b.start - a.start)
            .slice(0, n);
    }

    /**
     * Get the date range of the event set.
     */
    function getDateRange(events) {
        if (events.length === 0) return { start: new Date(), end: new Date() };
        const start = new Date(Math.min(...events.map(e => e.start)));
        const end = new Date(Math.max(...events.map(e => e.start)));
        return { start, end };
    }

    // === Helpers ===

    function formatCategoryLabel(key) {
        const labels = {
            meeting: 'Meetings',
            focus: 'Focus Time',
            social: 'Social',
            admin: 'Admin',
            other: 'Other'
        };
        return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    function formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    function formatDayLabel(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function getWeekKey(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
        return formatDateKey(d);
    }

    // Public API
    return { generateReport };
})();
