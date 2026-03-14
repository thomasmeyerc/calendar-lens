/**
 * parser.js — ICS File Parser
 * Parses .ics calendar files into structured event objects.
 */

const CalendarParser = (() => {

    /**
     * Parse an ICS file string into an array of event objects.
     * @param {string} icsContent - Raw ICS file content
     * @returns {Array} Array of event objects
     */
    function parseICS(icsContent) {
        const events = [];
        const lines = unfoldLines(icsContent);
        let currentEvent = null;
        let inEvent = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed === 'BEGIN:VEVENT') {
                inEvent = true;
                currentEvent = {};
                continue;
            }

            if (trimmed === 'END:VEVENT') {
                if (currentEvent && currentEvent.start) {
                    events.push(normalizeEvent(currentEvent));
                }
                inEvent = false;
                currentEvent = null;
                continue;
            }

            if (inEvent && currentEvent) {
                const { key, value } = parseLine(trimmed);
                switch (key) {
                    case 'SUMMARY':
                        currentEvent.summary = value;
                        break;
                    case 'DTSTART':
                    case 'DTSTART;VALUE=DATE':
                        currentEvent.start = parseICSDate(value);
                        currentEvent.allDay = value.length <= 8;
                        break;
                    case 'DTEND':
                    case 'DTEND;VALUE=DATE':
                        currentEvent.end = parseICSDate(value);
                        break;
                    case 'DESCRIPTION':
                        currentEvent.description = value;
                        break;
                    case 'LOCATION':
                        currentEvent.location = value;
                        break;
                    case 'CATEGORIES':
                        currentEvent.categories = value.split(',').map(c => c.trim());
                        break;
                    case 'STATUS':
                        currentEvent.status = value;
                        break;
                }

                // Handle DTSTART with timezone parameter
                if (key.startsWith('DTSTART;') && !currentEvent.start) {
                    currentEvent.start = parseICSDate(value);
                    currentEvent.allDay = value.length <= 8;
                }
                if (key.startsWith('DTEND;') && !currentEvent.end) {
                    currentEvent.end = parseICSDate(value);
                }
            }
        }

        return events.sort((a, b) => a.start - b.start);
    }

    /**
     * Unfold continuation lines per RFC 5545.
     */
    function unfoldLines(content) {
        return content.replace(/\r\n /g, '').replace(/\r\n\t/g, '').split(/\r?\n/);
    }

    /**
     * Parse a single ICS property line into key/value.
     */
    function parseLine(line) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) return { key: line, value: '' };
        return {
            key: line.substring(0, colonIdx).toUpperCase(),
            value: line.substring(colonIdx + 1)
        };
    }

    /**
     * Parse an ICS date string into a JavaScript Date object.
     * Supports: 20240115T143000Z, 20240115T143000, 20240115
     */
    function parseICSDate(dateStr) {
        const clean = dateStr.replace(/[^0-9TZ]/g, '');

        if (clean.length === 8) {
            // Date only: YYYYMMDD
            const y = parseInt(clean.substring(0, 4));
            const m = parseInt(clean.substring(4, 6)) - 1;
            const d = parseInt(clean.substring(6, 8));
            return new Date(y, m, d);
        }

        // DateTime: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
        const y = parseInt(clean.substring(0, 4));
        const m = parseInt(clean.substring(4, 6)) - 1;
        const d = parseInt(clean.substring(6, 8));
        const h = parseInt(clean.substring(9, 11)) || 0;
        const min = parseInt(clean.substring(11, 13)) || 0;
        const s = parseInt(clean.substring(13, 15)) || 0;

        if (clean.endsWith('Z')) {
            return new Date(Date.UTC(y, m, d, h, min, s));
        }
        return new Date(y, m, d, h, min, s);
    }

    /**
     * Normalize a raw parsed event into a clean event object.
     */
    function normalizeEvent(raw) {
        const start = raw.start;
        const end = raw.end || new Date(start.getTime() + 3600000); // default 1h
        const durationMs = end - start;
        const durationMin = Math.max(0, Math.round(durationMs / 60000));

        return {
            summary: raw.summary || '(No Title)',
            start: start,
            end: end,
            durationMin: durationMin,
            allDay: raw.allDay || false,
            description: raw.description || '',
            location: raw.location || '',
            categories: raw.categories || [],
            status: raw.status || 'CONFIRMED',
            category: categorizeEvent(raw.summary || '', raw.description || '', raw.categories || [])
        };
    }

    /**
     * Auto-categorize an event based on its title & description.
     */
    function categorizeEvent(summary, description, categories) {
        const text = (summary + ' ' + description).toLowerCase();

        // Check explicit ICS categories first
        if (categories.length > 0) {
            const cat = categories[0].toLowerCase();
            if (cat.includes('meeting') || cat.includes('sync')) return 'meeting';
            if (cat.includes('focus') || cat.includes('work') || cat.includes('deep')) return 'focus';
            if (cat.includes('social') || cat.includes('lunch') || cat.includes('fun')) return 'social';
            if (cat.includes('admin') || cat.includes('email') || cat.includes('hr')) return 'admin';
        }

        // Keyword-based categorization
        const meetingKeywords = ['meeting', 'sync', 'standup', 'stand-up', 'retro', 'sprint', 'review', 'call', 'zoom', 'teams', 'huddle', 'scrum', '1:1', '1-1', 'one on one', 'check-in', 'check in', 'interview', 'debrief', 'kickoff', 'kick-off', 'workshop', 'brainstorm', 'planning', 'demo'];
        const focusKeywords = ['focus', 'deep work', 'coding', 'development', 'design', 'write', 'writing', 'research', 'study', 'build', 'implement', 'review code', 'code review'];
        const socialKeywords = ['lunch', 'coffee', 'happy hour', 'social', 'team event', 'celebration', 'birthday', 'party', 'dinner', 'drinks', 'outing', 'fun', 'game'];
        const adminKeywords = ['admin', 'email', 'expenses', 'timesheet', 'hr ', 'payroll', 'onboarding', 'training', 'compliance', 'report', 'filing', 'errand', 'appointment', 'dentist', 'doctor'];

        if (meetingKeywords.some(kw => text.includes(kw))) return 'meeting';
        if (focusKeywords.some(kw => text.includes(kw))) return 'focus';
        if (socialKeywords.some(kw => text.includes(kw))) return 'social';
        if (adminKeywords.some(kw => text.includes(kw))) return 'admin';

        return 'other';
    }

    // Public API
    return { parseICS, categorizeEvent };
})();
