import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.pointStyle = 'circle';
ChartJS.defaults.plugins.legend.labels.padding = 16;

export const COLORS: Record<string, { bg: string; border: string }> = {
  meeting: { bg: 'rgba(129, 140, 248, 0.8)', border: '#818cf8' },
  focus:   { bg: 'rgba(45, 212, 191, 0.8)',  border: '#2dd4bf' },
  social:  { bg: 'rgba(251, 113, 133, 0.8)', border: '#fb7185' },
  admin:   { bg: 'rgba(251, 191, 36, 0.8)',  border: '#fbbf24' },
  other:   { bg: 'rgba(96, 165, 250, 0.8)',  border: '#60a5fa' },
};

export const CHART_BG = [
  'rgba(129,140,248,0.8)', 'rgba(45,212,191,0.8)', 'rgba(251,113,133,0.8)',
  'rgba(251,191,36,0.8)', 'rgba(96,165,250,0.8)', 'rgba(192,132,252,0.8)',
];

export const CHART_COLORS = [
  '#818cf8', '#2dd4bf', '#fb7185', '#fbbf24', '#60a5fa', '#c084fc',
];

export function isDark(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

export function gridColor(): string {
  return isDark() ? 'rgba(130, 140, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
}

export function tooltipStyle() {
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
