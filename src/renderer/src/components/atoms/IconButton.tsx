import { ReactNode, ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: ReactNode;
    label: string;
}

export const IconButton = ({ icon, label, className = "", ...props }: IconButtonProps) => (
    <button
        type="button"
        title={label}
        className={`p-2 rounded hover:bg-nss-text/10 text-nss-text transition-colors 
        focus:outline-none focus:ring-2 focus:ring-nss-primary ${className}`}
        {...props}
    >
        {icon}
    </button>
);