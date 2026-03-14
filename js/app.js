/**
 * app.js — Main Application Controller
 * Handles file uploads, sample data, UI state, and wiring everything together.
 */

(function () {
    'use strict';

    // === DOM Elements ===
    const uploadScreen = document.getElementById('upload-screen');
    const dashboard = document.getElementById('dashboard');
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const btnUpload = document.getElementById('btn-upload');
    const btnLoadSample = document.getElementById('btn-load-sample');
    const btnTrySample = document.getElementById('btn-try-sample');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Stats
    const statEvents = document.getElementById('stat-val-events');
    const statHours = document.getElementById('stat-val-hours');
    const statAvg = document.getElementById('stat-val-avg');
    const statLoad = document.getElementById('stat-val-load');

    // Table
    const eventsTbody = document.getElementById('events-tbody');
    const eventsCountBadge = document.getElementById('events-count-badge');

    // Daily chart range controls
    const ctrlWeek = document.getElementById('ctrl-daily-week');
    const ctrlMonth = document.getElementById('ctrl-daily-month');

    // === Initialization ===
    init();

    function init() {
        bindUploadEvents();
        bindNavEvents();
        bindChartControls();
    }

    // === Upload Handling ===
    function bindUploadEvents() {
        // Click to upload
        uploadZone.addEventListener('click', () => fileInput.click());
        btnUpload.addEventListener('click', () => fileInput.click());

        // File selected
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    function bindNavEvents() {
        btnLoadSample.addEventListener('click', loadSampleData);
        btnTrySample.addEventListener('click', loadSampleData);
    }

    function bindChartControls() {
        ctrlWeek.addEventListener('click', () => {
            ctrlWeek.classList.add('active');
            ctrlMonth.classList.remove('active');
            CalendarCharts.switchDailyRange('week');
        });

        ctrlMonth.addEventListener('click', () => {
            ctrlMonth.classList.add('active');
            ctrlWeek.classList.remove('active');
            CalendarCharts.switchDailyRange('month');
        });
    }

    // === File Processing ===
    function handleFile(file) {
        const reader = new FileReader();

        showLoading();

        reader.onload = (e) => {
            const content = e.target.result;

            setTimeout(() => {
                try {
                    const events = CalendarParser.parseICS(content);

                    if (events.length === 0) {
                        hideLoading();
                        alert('No events found in this file. Please check the file format.');
                        return;
                    }

                    processEvents(events);
                } catch (err) {
                    hideLoading();
                    console.error('Parse error:', err);
                    alert('Error parsing file. Please ensure it\'s a valid .ics file.');
                }
            }, 400); // Small delay for loading animation
        };

        reader.onerror = () => {
            hideLoading();
            alert('Error reading file.');
        };

        reader.readAsText(file);
    }

    function processEvents(events) {
        const report = CalendarAnalytics.generateReport(events);

        // Update stats with animated counting
        animateStat(statEvents, report.summary.totalEvents, '', '');
        animateStat(statHours, report.summary.totalHours, '', 'h');
        animateStat(statAvg, report.summary.avgDurationMin, '', 'm');
        animateStat(statLoad, report.summary.meetingLoad, '', '%');

        // Render charts
        CalendarCharts.destroyAll();
        CalendarCharts.renderAll(report);

        // Populate events table
        renderEventsTable(report.recentEvents);
        eventsCountBadge.textContent = `${report.summary.totalEvents} events`;

        // Show dashboard
        showDashboard();
        hideLoading();
    }

    // === Stats Animation ===
    function animateStat(el, target, prefix = '', suffix = '') {
        const duration = 800;
        const startTime = performance.now();
        const startVal = 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = startVal + (target - startVal) * eased;

            if (Number.isInteger(target)) {
                el.textContent = prefix + Math.round(current) + suffix;
            } else {
                el.textContent = prefix + (Math.round(current * 10) / 10) + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // === Events Table ===
    function renderEventsTable(events) {
        eventsTbody.innerHTML = '';

        for (const event of events) {
            const tr = document.createElement('tr');

            const tdName = document.createElement('td');
            tdName.textContent = event.summary;

            const tdDate = document.createElement('td');
            tdDate.textContent = event.start.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            const tdDuration = document.createElement('td');
            if (event.allDay) {
                tdDuration.textContent = 'All day';
            } else if (event.durationMin >= 60) {
                const hours = Math.floor(event.durationMin / 60);
                const mins = event.durationMin % 60;
                tdDuration.textContent = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            } else {
                tdDuration.textContent = `${event.durationMin}m`;
            }

            const tdCategory = document.createElement('td');
            const catSpan = document.createElement('span');
            catSpan.className = `category-dot cat-${event.category}`;
            catSpan.textContent = capitalize(event.category);
            tdCategory.appendChild(catSpan);

            tr.appendChild(tdName);
            tr.appendChild(tdDate);
            tr.appendChild(tdDuration);
            tr.appendChild(tdCategory);
            eventsTbody.appendChild(tr);
        }
    }

    // === UI State ===
    function showDashboard() {
        uploadScreen.style.display = 'none';
        dashboard.style.display = 'block';
        dashboard.style.animation = 'none';
        // Trigger reflow
        dashboard.offsetHeight;
        dashboard.style.animation = 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    // === Sample Data Generator ===
    function loadSampleData() {
        showLoading();

        setTimeout(() => {
            const events = generateSampleEvents();
            processEvents(events);
        }, 600);
    }

    function generateSampleEvents() {
        const events = [];
        const now = new Date();
        const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Event templates with category hints
        const templates = [
            { summary: 'Daily Stand-up', hour: 9, duration: 15, category: 'meeting', freq: 'daily' },
            { summary: 'Sprint Planning', hour: 10, duration: 60, category: 'meeting', freq: 'biweekly' },
            { summary: 'Team Sync', hour: 14, duration: 30, category: 'meeting', freq: 'weekly' },
            { summary: '1:1 with Manager', hour: 11, duration: 30, category: 'meeting', freq: 'weekly' },
            { summary: 'Code Review Session', hour: 15, duration: 45, category: 'focus', freq: 'triweekly' },
            { summary: 'Deep Work Block', hour: 10, duration: 120, category: 'focus', freq: 'daily' },
            { summary: 'Design Review', hour: 13, duration: 45, category: 'meeting', freq: 'weekly' },
            { summary: 'Sprint Retro', hour: 16, duration: 60, category: 'meeting', freq: 'biweekly' },
            { summary: 'Lunch with Team', hour: 12, duration: 60, category: 'social', freq: 'weekly' },
            { summary: 'Coffee Chat', hour: 15, duration: 30, category: 'social', freq: 'biweekly' },
            { summary: 'All Hands Meeting', hour: 11, duration: 60, category: 'meeting', freq: 'monthly' },
            { summary: 'Training Session', hour: 14, duration: 90, category: 'admin', freq: 'monthly' },
            { summary: 'Expense Report', hour: 16, duration: 30, category: 'admin', freq: 'monthly' },
            { summary: 'Brainstorm Session', hour: 10, duration: 60, category: 'meeting', freq: 'biweekly' },
            { summary: 'Product Demo', hour: 15, duration: 45, category: 'meeting', freq: 'biweekly' },
            { summary: 'Writing Documentation', hour: 14, duration: 60, category: 'focus', freq: 'weekly' },
            { summary: 'Interview - Candidate', hour: 11, duration: 60, category: 'meeting', freq: 'triweekly' },
            { summary: 'Happy Hour', hour: 17, duration: 60, category: 'social', freq: 'monthly' },
            { summary: 'Research Time', hour: 9, duration: 90, category: 'focus', freq: 'biweekly' },
            { summary: 'Cross-team Sync', hour: 13, duration: 30, category: 'meeting', freq: 'weekly' }
        ];

        // Generate 8 weeks of data (going back from today)
        for (let weekOffset = -8; weekOffset <= 0; weekOffset++) {
            for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) { // Mon-Fri
                const day = new Date(baseDate);
                day.setDate(day.getDate() + (weekOffset * 7) + dayOfWeek - baseDate.getDay() + 1);

                if (day > now) continue;

                for (const template of templates) {
                    let shouldAdd = false;
                    const weekNum = Math.abs(weekOffset);

                    switch (template.freq) {
                        case 'daily':
                            shouldAdd = true;
                            break;
                        case 'weekly':
                            shouldAdd = dayOfWeek === hashStr(template.summary) % 5;
                            break;
                        case 'biweekly':
                            shouldAdd = weekNum % 2 === 0 && dayOfWeek === hashStr(template.summary) % 5;
                            break;
                        case 'triweekly':
                            shouldAdd = weekNum % 3 === 0 && dayOfWeek === hashStr(template.summary) % 5;
                            break;
                        case 'monthly':
                            shouldAdd = weekNum % 4 === 0 && dayOfWeek === hashStr(template.summary) % 5;
                            break;
                    }

                    if (shouldAdd) {
                        // Add some variance
                        const variance = (hashStr(template.summary + day.toISOString()) % 20) - 10;
                        const startHour = template.hour;
                        const startMin = Math.max(0, Math.min(55, variance > 0 ? variance : 0));

                        const start = new Date(day);
                        start.setHours(startHour, startMin, 0, 0);

                        const end = new Date(start.getTime() + template.duration * 60000);

                        events.push({
                            summary: template.summary,
                            start,
                            end,
                            durationMin: template.duration,
                            allDay: false,
                            description: '',
                            location: '',
                            categories: [],
                            status: 'CONFIRMED',
                            category: template.category
                        });
                    }
                }
            }
        }

        return events.sort((a, b) => a.start - b.start);
    }

    // Simple string hash for deterministic "randomness"
    function hashStr(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

})();
