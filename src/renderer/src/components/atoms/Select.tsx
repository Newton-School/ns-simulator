import { clsx } from "clsx";

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