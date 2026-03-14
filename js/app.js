/**
 * app.js — Main Application Controller
 * Manages auth flow, calendar picker, calendar sync, file uploads, and UI state.
 */

(function () {
    'use strict';

    // === DOM Elements ===
    const authScreen = document.getElementById('auth-screen');
    const pickerScreen = document.getElementById('picker-screen');
    const uploadScreen = document.getElementById('upload-screen');
    const dashboard = document.getElementById('dashboard');
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Stats
    const statEvents = document.getElementById('stat-val-events');
    const statHours = document.getElementById('stat-val-hours');
    const statAvg = document.getElementById('stat-val-avg');
    const statLoad = document.getElementById('stat-val-load');

    // Table
    const eventsTbody = document.getElementById('events-tbody');
    const eventsCountBadge = document.getElementById('events-count-badge');

    // Controls
    const ctrlWeek = document.getElementById('ctrl-daily-week');
    const ctrlMonth = document.getElementById('ctrl-daily-month');

    // Auth buttons
    const btnGoogleSignin = document.getElementById('btn-google-signin');
    const btnOfflineMode = document.getElementById('btn-offline-mode');
    const btnBackToAuth = document.getElementById('btn-back-to-auth');
    const navSigninBtn = document.getElementById('nav-signin-btn');
    const btnSignout = document.getElementById('btn-signout');

    // Nav elements
    const navAuthActions = document.getElementById('nav-auth-actions');
    const navUserMenu = document.getElementById('nav-user-menu');
    const btnUploadNav = document.getElementById('btn-upload-nav');
    const btnSyncNav = document.getElementById('btn-sync-nav');

    // User avatar/dropdown
    const userAvatarBtn = document.getElementById('user-avatar-btn');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const userAvatarFallback = document.getElementById('user-avatar-fallback');
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownName = document.getElementById('dropdown-name');
    const dropdownEmail = document.getElementById('dropdown-email');

    // Picker
    const pickerList = document.getElementById('picker-list');
    const btnPickerAnalyze = document.getElementById('btn-picker-analyze');

    // Theme
    const themeToggle = document.getElementById('theme-toggle');

    // === State ===
    let isOfflineMode = false;
    let selectedCalendarIds = [];

    // === Initialize ===
    init();

    function init() {
        ThemeManager.init();
        Auth.init(handleAuthChange);
        bindEvents();
    }

    function bindEvents() {
        themeToggle.addEventListener('click', ThemeManager.toggle);

        btnGoogleSignin.addEventListener('click', () => Auth.signInWithGoogle());
        btnOfflineMode.addEventListener('click', enterOfflineMode);
        btnBackToAuth.addEventListener('click', showAuthScreen);

        if (navSigninBtn) navSigninBtn.addEventListener('click', () => Auth.signInWithGoogle());

        if (btnSignout) {
            btnSignout.addEventListener('click', async () => {
                closeDropdown();
                await Auth.signOut();
            });
        }

        if (btnUploadNav) btnUploadNav.addEventListener('click', () => fileInput.click());
        if (btnSyncNav) btnSyncNav.addEventListener('click', () => showPickerScreen());

        bindUploadEvents();
        bindChartControls();

        if (userAvatarBtn) userAvatarBtn.addEventListener('click', toggleDropdown);

        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target) && !userAvatarBtn.contains(e.target)) {
                closeDropdown();
            }
        });

        const btnTrySample = document.getElementById('btn-try-sample');
        if (btnTrySample) btnTrySample.addEventListener('click', loadSampleData);

        if (btnPickerAnalyze) btnPickerAnalyze.addEventListener('click', analyzeSelectedCalendars);
    }

    // === Auth State Handler ===
    function handleAuthChange(user) {
        if (user) {
            updateUserUI(user);
            showNavUserMenu(true);

            // After login redirect, show calendar picker
            if (!dashboard.style.display || dashboard.style.display === 'none') {
                const token = Auth.getGoogleAccessToken();
                if (token) {
                    showPickerScreen();
                } else {
                    enterOfflineMode();
                }
            }
        } else {
            showNavUserMenu(false);
            if (!isOfflineMode) {
                showAuthScreen();
            }
        }
    }

    function updateUserUI(user) {
        if (dropdownName) dropdownName.textContent = user.name;
        if (dropdownEmail) dropdownEmail.textContent = user.email;

        if (user.avatar) {
            userAvatarImg.src = user.avatar;
            userAvatarImg.alt = user.name;
            userAvatarImg.style.display = 'block';
            userAvatarFallback.style.display = 'none';
        } else {
            userAvatarImg.style.display = 'none';
            userAvatarFallback.style.display = 'flex';
            userAvatarFallback.textContent = (user.name || user.email || '?').charAt(0).toUpperCase();
        }
    }

    function showNavUserMenu(show) {
        if (navAuthActions) navAuthActions.style.display = show ? 'none' : 'flex';
        if (navUserMenu) navUserMenu.style.display = show ? 'flex' : 'none';
    }

    // === Calendar Picker ===
    async function showPickerScreen() {
        const token = Auth.getGoogleAccessToken();
        if (!token) {
            enterOfflineMode();
            return;
        }

        hideAllScreens();
        pickerScreen.style.display = 'flex';

        pickerList.innerHTML = '<div class="picker-loading">Loading calendars...</div>';
        btnPickerAnalyze.disabled = true;
        selectedCalendarIds = [];

        try {
            const calendars = await CalendarSync.listCalendars(token);

            if (calendars.length === 0) {
                pickerList.innerHTML = '<div class="picker-loading">No calendars found.</div>';
                return;
            }

            pickerList.innerHTML = '';

            calendars.forEach((cal) => {
                const item = document.createElement('div');
                item.className = 'picker-item';
                item.dataset.calendarId = cal.id;

                // Auto-select primary calendar
                if (cal.primary) {
                    item.classList.add('selected');
                    selectedCalendarIds.push(cal.id);
                }

                item.innerHTML = `
                    <div class="picker-check">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="picker-color" style="background: ${cal.color || 'var(--accent)'}"></div>
                    <div class="picker-info">
                        <span class="picker-name">${escapeHtml(cal.name)}${cal.primary ? '<span class="picker-primary-badge">Primary</span>' : ''}</span>
                    </div>
                `;

                item.addEventListener('click', () => {
                    item.classList.toggle('selected');
                    const id = item.dataset.calendarId;

                    if (item.classList.contains('selected')) {
                        if (!selectedCalendarIds.includes(id)) selectedCalendarIds.push(id);
                    } else {
                        selectedCalendarIds = selectedCalendarIds.filter((c) => c !== id);
                    }

                    btnPickerAnalyze.disabled = selectedCalendarIds.length === 0;
                });

                pickerList.appendChild(item);
            });

            btnPickerAnalyze.disabled = selectedCalendarIds.length === 0;
        } catch (err) {
            console.error('Failed to load calendars:', err);
            pickerList.innerHTML = '<div class="picker-loading">Failed to load calendars. Try again.</div>';
        }
    }

    async function analyzeSelectedCalendars() {
        const token = Auth.getGoogleAccessToken();
        if (!token || selectedCalendarIds.length === 0) return;

        showLoading('Syncing your calendars...');

        try {
            // Fetch events from all selected calendars in parallel
            const results = await Promise.all(
                selectedCalendarIds.map((calId) =>
                    CalendarSync.fetchEvents(token, { calendarId: calId }).catch(() => [])
                )
            );

            const allEvents = results.flat();

            if (allEvents.length === 0) {
                hideLoading();
                alert('No events found in the selected calendars for the past ' + AppConfig.DEFAULT_FETCH_DAYS + ' days.');
                return;
            }

            // Sort by start time
            allEvents.sort((a, b) => a.start - b.start);
            processEvents(allEvents);
        } catch (err) {
            console.error('Calendar sync error:', err);
            hideLoading();

            if (err.message === 'UNAUTHORIZED') {
                Auth.signInWithGoogle();
            } else {
                alert('Error syncing calendars. Please try again.');
            }
        }
    }

    // === Upload Handling ===
    function bindUploadEvents() {
        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0]);
        });

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
            if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
        });
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

    function handleFile(file) {
        const reader = new FileReader();
        showLoading('Analyzing your calendar...');

        reader.onload = (e) => {
            setTimeout(() => {
                try {
                    const events = CalendarParser.parseICS(e.target.result);
                    if (events.length === 0) {
                        hideLoading();
                        alert('No events found in this file.');
                        return;
                    }
                    processEvents(events);
                } catch (err) {
                    hideLoading();
                    console.error('Parse error:', err);
                    alert('Error parsing file. Please ensure it\'s a valid .ics file.');
                }
            }, 300);
        };

        reader.onerror = () => {
            hideLoading();
            alert('Error reading file.');
        };

        reader.readAsText(file);
    }

    function processEvents(events) {
        const report = CalendarAnalytics.generateReport(events);

        animateStat(statEvents, report.summary.totalEvents, '', '');
        animateStat(statHours, report.summary.totalHours, '', 'h');
        animateStat(statAvg, report.summary.avgDurationMin, '', 'm');
        animateStat(statLoad, report.summary.meetingLoad, '', '%');

        CalendarCharts.destroyAll();
        CalendarCharts.renderAll(report);

        renderEventsTable(report.recentEvents);
        eventsCountBadge.textContent = `${report.summary.totalEvents} events`;

        showDashboard();
        hideLoading();
    }

    // === Stats Animation ===
    function animateStat(el, target, prefix, suffix) {
        const duration = 600;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            el.textContent = Number.isInteger(target)
                ? prefix + Math.round(current) + suffix
                : prefix + (Math.round(current * 10) / 10) + suffix;

            if (progress < 1) requestAnimationFrame(update);
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
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
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

    // === Screen Navigation ===
    function hideAllScreens() {
        authScreen.style.display = 'none';
        pickerScreen.style.display = 'none';
        uploadScreen.style.display = 'none';
        dashboard.style.display = 'none';
    }

    function showAuthScreen() {
        isOfflineMode = false;
        hideAllScreens();
        authScreen.style.display = 'flex';
    }

    function enterOfflineMode() {
        isOfflineMode = true;
        hideAllScreens();
        uploadScreen.style.display = 'flex';
    }

    function showDashboard() {
        hideAllScreens();
        dashboard.style.display = 'block';
        dashboard.style.animation = 'none';
        dashboard.offsetHeight;
        dashboard.style.animation = 'fadeIn 0.5s var(--ease-out)';
    }

    function showLoading(text) {
        const loadingText = loadingOverlay.querySelector('.loading-text');
        if (loadingText && text) loadingText.textContent = text;
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    // === Dropdown ===
    function toggleDropdown() {
        userDropdown.classList.toggle('open');
    }

    function closeDropdown() {
        userDropdown.classList.remove('open');
    }

    // === Helpers ===
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // === Sample Data ===
    function loadSampleData() {
        showLoading('Generating sample data...');
        setTimeout(() => processEvents(generateSampleEvents()), 400);
    }

    function generateSampleEvents() {
        const events = [];
        const now = new Date();
        const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

        for (let weekOffset = -8; weekOffset <= 0; weekOffset++) {
            for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
                const day = new Date(baseDate);
                day.setDate(day.getDate() + (weekOffset * 7) + dayOfWeek - baseDate.getDay() + 1);
                if (day > now) continue;

                for (const template of templates) {
                    let shouldAdd = false;
                    const weekNum = Math.abs(weekOffset);

                    switch (template.freq) {
                        case 'daily': shouldAdd = true; break;
                        case 'weekly': shouldAdd = dayOfWeek === hashStr(template.summary) % 5; break;
                        case 'biweekly': shouldAdd = weekNum % 2 === 0 && dayOfWeek === hashStr(template.summary) % 5; break;
                        case 'triweekly': shouldAdd = weekNum % 3 === 0 && dayOfWeek === hashStr(template.summary) % 5; break;
                        case 'monthly': shouldAdd = weekNum % 4 === 0 && dayOfWeek === hashStr(template.summary) % 5; break;
                    }

                    if (shouldAdd) {
                        const variance = (hashStr(template.summary + day.toISOString()) % 20) - 10;
                        const startMin = Math.max(0, Math.min(55, variance > 0 ? variance : 0));
                        const start = new Date(day);
                        start.setHours(template.hour, startMin, 0, 0);
                        const end = new Date(start.getTime() + template.duration * 60000);

                        events.push({
                            summary: template.summary, start, end,
                            durationMin: template.duration, allDay: false,
                            description: '', location: '', categories: [],
                            status: 'CONFIRMED', category: template.category
                        });
                    }
                }
            }
        }

        return events.sort((a, b) => a.start - b.start);
    }

    function hashStr(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

})();
