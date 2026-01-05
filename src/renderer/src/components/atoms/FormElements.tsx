import React from 'react';
import { clsx } from 'clsx';

// --- ATOMS ---

export const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={clsx("text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block", className)}>
    {children}
  </label>
);

export const Input = ({ className, rightElement, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { rightElement?: React.ReactNode }) => (
  <div className="relative group">
    <input
      className={clsx(
        "w-full bg-[#18181b] border border-gray-800 hover:border-gray-700 focus:border-blue-500 rounded px-3 py-2 text-sm text-gray-200 outline-none transition-colors font-mono",
        className
      )}
      {...props}
    />
    {rightElement && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">
        {rightElement}
      </div>
    )}
  </div>
);

export const Select = ({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select
      className={clsx(
        "w-full appearance-none bg-[#18181b] border border-gray-800 hover:border-gray-700 focus:border-blue-500 rounded px-3 py-2 text-sm text-gray-200 outline-none transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </select>

    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
    </div>
  </div>
);

export const Slider = ({ value, min = 0, max = 100, unit, onChange }: { value: number, min?: number, max?: number, unit?: string, onChange: (val: number) => void }) => (
  <div className="bg-[#18181b] border border-gray-800 rounded p-3 group hover:border-gray-700 transition-colors">
    <div className="flex justify-between items-end mb-2">
      <span className="text-xs text-gray-400 font-medium">{unit}</span>
      <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
        {value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
  </div>
);

export const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    degraded: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const styles = colors[status] || colors.healthy;

  return (
    <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border", styles)}>
      {status}
    </span>
  );
};