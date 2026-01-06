import React from 'react';
import { clsx } from 'clsx';

// --- ATOMS ---

export const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={clsx("text-[11px] font-bold text-nss-muted uppercase tracking-wider mb-1.5 block", className)}>
    {children}
  </label>
);

export const Input = ({ className, rightElement, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { rightElement?: React.ReactNode }) => (
  <div className="relative group">
    <input
      className={clsx(
        "w-full bg-nss-input-bg border border-nss-border hover:border-nss-muted/50 focus:border-nss-primary rounded px-3 py-2 text-sm text-nss-text outline-none transition-colors font-mono placeholder:text-nss-placeholder",
        className
      )}
      {...props}
    />
    {rightElement && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-nss-muted text-xs pointer-events-none">
        {rightElement}
      </div>
    )}
  </div>
);

export const Select = ({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select
      className={clsx(
        "w-full appearance-none bg-nss-input-bg border border-nss-border hover:border-nss-muted/50 focus:border-nss-primary rounded px-3 py-2 text-sm text-nss-text outline-none transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </select>

    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-nss-muted">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
    </div>
  </div>
);

export const Slider = ({ value, min = 0, max = 100, unit, onChange }: { value: number, min?: number, max?: number, unit?: string, onChange: (val: number) => void }) => (
  <div className="bg-nss-input-bg border border-nss-border rounded p-3 group hover:border-nss-muted/50 transition-colors">
    <div className="flex justify-between items-end mb-2">
      <span className="text-xs text-nss-muted font-medium">{unit}</span>
      <span className="text-xs text-nss-primary font-mono bg-nss-primary/10 px-1.5 py-0.5 rounded border border-nss-primary/20">
        {value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-nss-border rounded-lg appearance-none cursor-pointer accent-nss-primary"
    />
  </div>
);

export const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    healthy: 'bg-nss-success/10 text-nss-success border-nss-success/20',
    degraded: 'bg-nss-warning/10 text-nss-warning border-nss-warning/20',
    critical: 'bg-nss-danger/10 text-nss-danger border-nss-danger/20',
  };
  const styles = colors[status] || colors.healthy;

  return (
    <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border", styles)}>
      {status}
    </span>
  );
};