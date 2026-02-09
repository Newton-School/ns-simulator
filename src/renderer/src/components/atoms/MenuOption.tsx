import { memo } from 'react';
import { LucideIcon } from 'lucide-react';

interface MenuOptionProps {
    icon: LucideIcon;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    isDestructive?: boolean;
}

export const MenuOption = memo(({ icon: Icon, label, onClick, isDestructive }: MenuOptionProps) => {
    if (!Icon) return null;

    return (
        <button
            onClick={onClick}
            className={`
        w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors text-left
        ${isDestructive
                    ? 'text-nss-danger hover:bg-nss-danger/10'
                    : 'text-nss-text hover:bg-nss-surface hover:text-nss-primary'}
      `}
        >
            <Icon size={14} />
            <span>{label}</span>
        </button>
    );
});
MenuOption.displayName = 'MenuOption';