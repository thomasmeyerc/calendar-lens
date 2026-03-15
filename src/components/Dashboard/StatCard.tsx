import { useEffect, useRef } from 'react';
import { APP_CONFIG } from '../../types/calendar';

interface StatCardProps {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: number;
  suffix: string;
  delay: number;
}

export function StatCard({ icon, iconClass, label, value, suffix, delay }: StatCardProps) {
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = valueRef.current;
    if (!el) return;

    const duration = APP_CONFIG.statAnimationMs;
    const startTime = performance.now();
    const isInt = Number.isInteger(value);

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = value * eased;
      el!.textContent = isInt
        ? Math.round(current) + suffix
        : (Math.round(current * 10) / 10) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }, [value, suffix]);

  return (
    <div className="stat-card" style={{ animationDelay: `${delay}s` }} role="status" aria-live="polite">
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div className="stat-content">
        <div className="stat-value" ref={valueRef}>0{suffix}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
