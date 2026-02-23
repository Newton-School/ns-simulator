import { memo } from 'react'
import { LucideIcon, HelpCircle } from 'lucide-react'

interface NodeHeaderProps {
  label: string
  icon: LucideIcon
  status?: 'healthy' | 'degraded' | 'critical'
  color?: string
  children?: React.ReactNode
}

export const NodeHeader = memo(
  ({ label, icon: Icon, status = 'healthy', color, children }: NodeHeaderProps) => {
    const statusColors = {
      healthy: 'bg-nss-success shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      degraded: 'bg-nss-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]',
      critical: 'bg-nss-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]'
    }

    const safeColor = color || 'bg-nss-primary'

    const SafeIcon = Icon || HelpCircle

    return (
      <div className="bg-nss-panel p-3 border-b border-nss-border flex justify-between items-center rounded-t-lg">
        {/* Left Side: Icon + Label */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`p-1.5 rounded bg-opacity-50 ${safeColor} shrink-0 flex items-center justify-center`}
          >
            <SafeIcon size={16} className={safeColor.replace('bg-', 'text-')} />
          </div>

          <span className="font-bold text-sm text-nss-text truncate max-w-[120px]">{label}</span>
        </div>

        {/* Right Side: Status + Menu */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${statusColors[status]}`}
            title={`Status: ${status}`}
          />
          {children}
        </div>
      </div>
    )
  }
)

NodeHeader.displayName = 'NodeHeader'
