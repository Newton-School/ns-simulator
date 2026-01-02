export interface ProgressBarProps {
    label: string;
    value: number; // 0 to 100
    colorClass?: string;
}

export const ProgressBar = ({ label, value, colorClass = "bg-nss-primary" }: ProgressBarProps) => {
    // Guard clause: If value is missing, don't render
    if (value === undefined || value === null) return null;

    return (
        <div className="w-full mt-2">
            <div className="flex justify-between text-[10px] text-nss-muted mb-1 uppercase tracking-wider font-semibold">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="w-full h-1.5 bg-nss-bg rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
            </div>
        </div>
    );
};