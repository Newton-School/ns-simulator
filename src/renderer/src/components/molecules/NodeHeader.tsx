import { LucideIcon } from 'lucide-react';

interface NodeHeaderProps {
    label: string;
    icon: LucideIcon;
    status?: 'healthy' | 'degraded' | 'critical';
    color?: string;
}

export const NodeHeader = ({
    label,
    icon: Icon,
    status = 'healthy',
    color
}: NodeHeaderProps) => {

    const statusColors = {
        healthy: 'bg-nss-success shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        degraded: 'bg-nss-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        critical: 'bg-nss-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    };

    // If no color passed, default to primary blue
    const safeColor = color || 'bg-nss-primary';

    return (
        <div className="bg-nss-panel p-3 border-b border-nss-border flex justify-between items-center">
            <div className="flex items-center gap-3">
                {/* Colored Icon Well */}
                <div className={`p-1.5 rounded bg-opacity-40 ${safeColor} shrink-0 flex items-center justify-center`}>
                    <Icon size={16} className={safeColor.replace('bg-', 'text-')} />
                </div>

                <span className="font-bold text-sm text-nss-text truncate max-w-[140px]">
                    {label}
                </span>
            </div>

            {/* Status Dot */}
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${statusColors[status]}`} />
        </div>
    );
};