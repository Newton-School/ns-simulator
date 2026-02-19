import { memo } from 'react'
import { Cloud, Lock } from 'lucide-react'

interface VpcHeaderProps {
  label: string
  isSuccessState: boolean
  children?: React.ReactNode
}

export const VpcHeader = memo(({ label, isSuccessState, children }: VpcHeaderProps) => {
  return (
    <div
      className={`
      absolute top-0 left-0 right-0 px-4 py-2 border-b border-dashed flex items-center gap-2
      ${isSuccessState ? 'border-[rgb(var(--nss-success))]/30' : 'border-[var(--nss-vpc-border)]'}
        `}
    >
      <div className="p-1 rounded bg-nss-surface border border-nss-border">
        <Cloud
          size={14}
          className={isSuccessState ? 'text-[rgb(var(--nss-success))]' : 'text-nss-primary'}
        />
      </div>

      <span className="text-xs font-bold text-nss-muted uppercase tracking-wider">
        {label || 'VPC Region'}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {!isSuccessState && (
          <div title="Grouped" className="flex items-center">
            <Lock size={12} className="text-nss-muted opacity-50" />
          </div>
        )}

        {children}
      </div>
    </div>
  )
})
VpcHeader.displayName = 'VpcHeader'
