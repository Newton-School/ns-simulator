import { memo } from 'react'
import { Cloud, Lock, LucideIcon } from 'lucide-react'
import { InlineEditableLabel } from '@renderer/components/molecules/InlineEditable'
interface VpcHeaderProps {
  label: string
  isSuccessState: boolean
  icon?: LucideIcon
  onLabelChange?: (newLabel: string) => void
  children?: React.ReactNode
}

export const VpcHeader = memo(
  ({ label, isSuccessState, icon: Icon = Cloud, onLabelChange, children }: VpcHeaderProps) => {
    return (
      <div
        className={`
      absolute top-0 left-0 right-0 px-4 py-2 border-b border-dashed flex items-center gap-2
      ${isSuccessState ? 'border-[rgb(var(--nss-success))]/30' : 'border-[var(--nss-vpc-border)]'}
        `}
      >
        <div className="p-1 rounded bg-nss-surface border border-nss-border shrink-0">
          <Icon
            size={14}
            className={isSuccessState ? 'text-[rgb(var(--nss-success))]' : 'text-nss-primary'}
          />
        </div>

        <div className="flex-1 overflow-hidden flex items-center">
          <InlineEditableLabel
            value={label || 'VPC Region'}
            onSave={(newLabel) => onLabelChange?.(newLabel)}
            textClassName="text-xs font-bold text-nss-muted uppercase tracking-wider truncate"
            inputClassName="text-xs font-bold text-nss-text uppercase tracking-wider w-full min-w-[100px]"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {!isSuccessState && (
            <div title="Grouped" className="flex items-center">
              <Lock size={12} className="text-nss-muted opacity-50" />
            </div>
          )}

          {children}
        </div>
      </div>
    )
  }
)

VpcHeader.displayName = 'VpcHeader'
