import { memo } from 'react';
import { X } from 'lucide-react';

interface MenuHeaderProps {
    onClose: () => void;
}

export const MenuHeader = memo(({ onClose }: MenuHeaderProps) => (
    <div className="px-3 py-2 bg-nss-surface/50 border-b border-nss-border flex justify-between items-center">
        <span className="text-[10px] font-bold text-nss-muted uppercase tracking-wider">
            Actions
        </span>
        <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-nss-muted hover:text-nss-text hover:bg-nss-border/50 rounded p-0.5 transition-colors"
            title="Close"
        >
            <X size={12} />
        </button>
    </div>
));
MenuHeader.displayName = 'MenuHeader';