import { memo } from 'react'
import { LucideIcon, HelpCircle } from 'lucide-react'
import { InlineEditableLabel } from '../properties/InlineEditable'
import { ColorTheme } from '@renderer/types/ui'

const STATUS_COLORS = {
  healthy: 'bg-nss-success shadow-[0_0_8px_rgba(16,185,129,0.4)]',
  degraded: 'bg-nss-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]',
  critical: 'bg-nss-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]'
} as const

interface NodeHeaderProps {
  label: string
  icon?: LucideIcon
  status?: keyof typeof STATUS_COLORS
  color?: ColorTheme | string
  onLabelChange?: (newLabel: string) => void
  children?: React.ReactNode
}

export const NodeHeader = memo(
  ({
    label,
    icon: Icon = HelpCircle,
    status = 'healthy',
    color,
    onLabelChange,
    children
  }: NodeHeaderProps) => {
    const safeBg = typeof color === 'string' ? color : color?.bg || 'bg-nss-primary'
    const safeText =
      typeof color === 'string' ? color.replace('bg-', 'text-') : color?.text || 'text-nss-primary'

    const SafeIcon = Icon || HelpCircle

    return (
      <div className="bg-nss-panel p-3 border-b border-nss-border flex justify-between items-center rounded-t-lg">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`p-1.5 rounded bg-opacity-50 ${safeBg} shrink-0 flex items-center justify-center`}
          >
            <SafeIcon size={16} className={safeText} />
          </div>

          {onLabelChange ? (
            <InlineEditableLabel
              value={label}
              onSave={(newLabel) => onLabelChange(newLabel)}
              textClassName="font-bold text-sm max-w-[120px]"
              inputClassName="font-bold text-sm w-24"
            />
          ) : (
            <span className="font-bold text-sm max-w-[120px] truncate">{label}</span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${STATUS_COLORS[status]}`}
            title={`Status: ${status}`}
          />
          {children}
        </div>
      </div>
    )
  }
)

NodeHeader.displayName = 'NodeHeader'
