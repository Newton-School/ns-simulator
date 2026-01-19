import { clsx } from 'clsx';

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