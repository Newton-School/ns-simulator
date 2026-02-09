export interface ProgressBarProps {
    label: string;
    value: number; // 0 to 100
    showValue?: boolean;
}

export const ProgressBar = ({ label, value, showValue = true }: ProgressBarProps) => {
    if (value === undefined || value === null) return null;

    const getBarColor = (val: number) => {
        if (val >= 90) return 'bg-nss-danger';
        if (val >= 70) return 'bg-nss-warning';
        return 'bg-nss-success';
    };

    const clampedValue = Math.max(0, Math.min(100, value));

    return (
        <div className="w-full space-y-1">
            <div className="flex justify-between text-[10px] text-nss-muted uppercase tracking-wider font-semibold">
                <span>{label}</span>
                {showValue && <span>{clampedValue}%</span>}
            </div>
            <div className="w-full h-2 bg-nss-bg rounded-full overflow-hidden border border-nss-border">
                <div
                    className={`h-full transition-all duration-500 ${getBarColor(clampedValue)}`}
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
        </div>
    );
};