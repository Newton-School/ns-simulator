import { clsx } from 'clsx'
import { ReactNode } from 'react'

export const Label = ({ children, className }: { children: ReactNode; className?: string }) => (
  <label
    className={clsx(
      'text-[11px] font-bold text-nss-muted uppercase tracking-wider mb-1.5 block',
      className
    )}
  >
    {children}
  </label>
)
