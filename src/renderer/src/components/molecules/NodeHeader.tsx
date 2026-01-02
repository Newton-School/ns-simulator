import { LucideIcon } from 'lucide-react';

interface NodeHeaderProps {
    label: string;
    icon: LucideIcon;
    status?: 'healthy' | 'degraded' | 'critical';
}

export const NodeHeader = ({ label, icon: Icon, status = 'healthy' }: NodeHeaderProps) => {
    const statusColors = {
        healthy: 'bg-nss-success shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        degraded: 'bg-nss-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        critical: 'bg-nss-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    };

    return (
        <div className="bg-nss-panel p-3 border-b border-nss-border flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Icon size={14} className="text-nss-primary" />
                <span className="font-bold text-sm text-nss-text truncate max-w-[140px]">
                    {label}
                </span>
            </div>
            {/* Status Dot */}
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${statusColors[status]}`} />
        </div>
    );
};