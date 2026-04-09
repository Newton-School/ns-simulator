import { StatusBadge } from '../ui/StatusBadge'
import { resolveNodeConfig } from '@renderer/config/nodeRegistry'

interface PropertiesHeaderProps {
  data: any
}

export const PropertiesHeader = ({ data }: PropertiesHeaderProps) => {
  const lookupKey = data.computeType || data.iconKey
  const { icon: Icon, theme, label, subLabel } = resolveNodeConfig(lookupKey)

  const isOverloaded = data.is_overloaded
  const safeColor = theme.bg || 'bg-nss-primary'

  return (
    <div className="p-5 border-b border-nss-border bg-nss-panel">
      <div className="flex items-center gap-4">
        <div
          className={`
          shrink-0 transition-all duration-300 rounded-lg p-2 shadow-sm
          ${
            isOverloaded
              ? 'bg-nss-danger/10 border-nss-danger/30 text-nss-danger ring-1 ring-nss-danger/30'
              : `p-1.5 rounded bg-opacity-40 ${safeColor} shrink-0 flex items-center justify-center`
          }
        `}
        >
          <Icon size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h2
              className={`font-semibold text-sm leading-tight truncate pr-2 ${isOverloaded ? 'text-nss-danger' : 'text-nss-text'}`}
            >
              {data.label || label}
            </h2>

            {data.status && <StatusBadge status={data.status} />}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-nss-muted font-mono uppercase truncate">
              {/* Prioritize subLabel from config if not on data */}
              {data.subLabel || subLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
