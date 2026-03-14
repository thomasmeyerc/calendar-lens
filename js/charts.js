/**
 * charts.js — Chart Rendering Module
 * Uses Chart.js to render all dashboard visualizations.
 */

const CalendarCharts = (() => {

    // Chart color palette
    const COLORS = {
        meeting: { bg: 'rgba(129, 140, 248, 0.8)', border: '#818cf8' },
        focus:   { bg: 'rgba(45, 212, 191, 0.8)',  border: '#2dd4bf' },
        social:  { bg: 'rgba(251, 113, 133, 0.8)', border: '#fb7185' },
        admin:   { bg: 'rgba(251, 191, 36, 0.8)',  border: '#fbbf24' },
        other:   { bg: 'rgba(96, 165, 250, 0.8)',  border: '#60a5fa' }
    };

    const CHART_COLORS = [
        '#818cf8', '#2dd4bf', '#fb7185', '#fbbf24', '#60a5fa',
        '#c084fc', '#34d399', '#f472b6', '#a78bfa', '#38bdf8'
    ];

    const CHART_BG = [
        'rgba(129,140,248,0.8)', 'rgba(45,212,191,0.8)', 'rgba(251,113,133,0.8)',
        'rgba(251,191,36,0.8)', 'rgba(96,165,250,0.8)', 'rgba(192,132,252,0.8)',
        'rgba(52,211,153,0.8)', 'rgba(244,114,182,0.8)', 'rgba(167,139,250,0.8)',
        'rgba(56,189,248,0.8)'
    ];

    // Chart.js global defaults
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
    Chart.defaults.plugins.legend.labels.padding = 16;

    // Theme-aware helpers
    function getThemeColor(prop) {
        return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
    }

    function isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function tooltipStyle() {
        return {
            backgroundColor: isDark() ? 'rgba(15, 15, 26, 0.95)' : 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: isDark() ? 'rgba(129, 140, 248, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
        };
    }

    function gridColor() {
        return isDark() ? 'rgba(130, 140, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
    }

    function applyThemeDefaults() {
        Chart.defaults.color = isDark() ? '#9b9bb8' : '#64748b';
    }

    // Store chart instances for cleanup
    const charts = {};

    /**
     * Render all charts from analytics report.
     */
    function renderAll(report) {
        applyThemeDefaults();
        renderAllocation(report.categoryBreakdown);
        renderDaily(report.dailyHours);
        renderHeatmap(report.heatmap);
        renderTrend(report.weeklyTrend);
        renderDuration(report.durationDistribution);
    }

    /**
     * Destroy all existing charts.
     */
    function destroyAll() {
        Object.values(charts).forEach(c => c.destroy && c.destroy());
    }

    /**
     * Time Allocation Pie/Doughnut chart.
     */
    function renderAllocation(categoryData) {
        const ctx = document.getElementById('chart-allocation');
        if (charts.allocation) charts.allocation.destroy();

        const labels = categoryData.map(c => c.label);
        const data = categoryData.map(c => c.hours);
        const bgColors = categoryData.map(c => COLORS[c.key]?.bg || 'rgba(96,165,250,0.8)');
        const borderColors = categoryData.map(c => COLORS[c.key]?.border || '#60a5fa');

        charts.allocation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 13 }
                        }
                    },
                    tooltip: {
                        ...tooltipStyle(),
                        titleFont: { weight: 600 },
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = Math.round((ctx.raw / total) * 100);
                                return ` ${ctx.label}: ${ctx.raw}h (${pct}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    /**
     * Daily hours bar chart.
     */
    function renderDaily(dailyData, slice = 'week') {
        const ctx = document.getElementById('chart-daily');
        if (charts.daily) charts.daily.destroy();

        let data = dailyData;
        if (slice === 'week') {
            data = dailyData.slice(-7);
        } else if (slice === 'month') {
            data = dailyData.slice(-30);
        }

        charts.daily = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    label: 'Hours',
                    data: data.map(d => d.hours),
                    backgroundColor: createBarGradient(ctx, data.length),
                    borderRadius: 6,
                    borderSkipped: false,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipStyle(),
                        callbacks: {
                            label: (ctx) => ` ${ctx.raw} hours`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 11 },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        border: { display: false }
                    },
                    y: {
                        grid: {
                            color: gridColor(),
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 11 },
                            callback: (v) => v + 'h'
                        },
                        border: { display: false },
                        beginAtZero: true
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            }
        });

        // Store daily data for range switching
        charts._dailyData = dailyData;
    }

    /**
     * Switch daily chart between week/month view.
     */
    function switchDailyRange(range) {
        if (charts._dailyData) {
            renderDaily(charts._dailyData, range);
        }
    }

    /**
     * Create gradient fills for bar charts.
     */
    function createBarGradient(ctx, count) {
        try {
            const canvas = ctx.getContext ? ctx : ctx.canvas;
            const context = canvas.getContext('2d');
            const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(129, 140, 248, 0.9)');
            gradient.addColorStop(1, 'rgba(192, 132, 252, 0.6)');
            return Array(count).fill(gradient);
        } catch {
            return Array(count).fill('rgba(129, 140, 248, 0.8)');
        }
    }

    /**
     * Busy hours heatmap (custom HTML rendering, no Chart.js).
     */
    function renderHeatmap(heatmapData) {
        const container = document.getElementById('heatmap-container');
        container.innerHTML = '';

        const { grid, maxValue, days } = heatmapData;

        // Header row: empty cell + hour labels
        const emptyCorner = document.createElement('div');
        container.appendChild(emptyCorner);

        for (let h = 0; h < 24; h++) {
            const label = document.createElement('div');
            label.className = 'heatmap-hour-label';
            label.textContent = h % 3 === 0 ? `${h}:00` : '';
            container.appendChild(label);
        }

        // Data rows
        for (let d = 0; d < 7; d++) {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'heatmap-label';
            dayLabel.textContent = days[d];
            container.appendChild(dayLabel);

            for (let h = 0; h < 24; h++) {
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                const val = grid[d][h];
                const intensity = val / maxValue;

                if (val > 0) {
                    const alpha = 0.15 + (intensity * 0.75);
                    // Color interpolation from purple to coral based on intensity
                    if (intensity < 0.5) {
                        cell.style.background = `rgba(129, 140, 248, ${alpha})`;
                    } else if (intensity < 0.8) {
                        cell.style.background = `rgba(192, 132, 252, ${alpha})`;
                    } else {
                        cell.style.background = `rgba(251, 113, 133, ${alpha})`;
                    }
                }

                cell.setAttribute('data-tooltip', `${days[d]} ${h}:00 — ${val} event${val !== 1 ? 's' : ''}`);
                container.appendChild(cell);
            }
        }
    }

    /**
     * Weekly trend line chart.
     */
    function renderTrend(weeklyData) {
        const ctx = document.getElementById('chart-trend');
        if (charts.trend) charts.trend.destroy();

        charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeklyData.map(w => {
                    const d = new Date(w.week);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Hours',
                    data: weeklyData.map(w => w.hours),
                    borderColor: '#818cf8',
                    backgroundColor: 'rgba(129, 140, 248, 0.1)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#818cf8',
                    pointBorderColor: isDark() ? '#0f0f1a' : '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipStyle(),
                        callbacks: {
                            title: (items) => `Week of ${items[0].label}`,
                            label: (ctx) => ` ${ctx.raw} hours`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } },
                        border: { display: false }
                    },
                    y: {
                        grid: {
                            color: gridColor(),
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 11 },
                            callback: (v) => v + 'h'
                        },
                        border: { display: false },
                        beginAtZero: true
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    /**
     * Duration distribution horizontal bar chart.
     */
    function renderDuration(durationData) {
        const ctx = document.getElementById('chart-duration');
        if (charts.duration) charts.duration.destroy();

        charts.duration = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: durationData.map(d => d.label),
                datasets: [{
                    label: 'Events',
                    data: durationData.map(d => d.count),
                    backgroundColor: CHART_BG.slice(0, durationData.length),
                    borderColor: CHART_COLORS.slice(0, durationData.length),
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipStyle(),
                        callbacks: {
                            label: (ctx) => ` ${ctx.raw} events`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: gridColor(),
                            drawBorder: false
                        },
                        ticks: { font: { size: 11 } },
                        border: { display: false },
                        beginAtZero: true
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 12, weight: 500 } },
                        border: { display: false }
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Public API
    return { renderAll, destroyAll, switchDailyRange };
})();
