import type { AnyNodeData } from '@renderer/types/ui'
import { resolveNodeConfig } from '@renderer/config/nodeRegistry'

interface PropertiesHeaderProps {
  data: AnyNodeData
}

export const PropertiesHeader = ({ data }: PropertiesHeaderProps) => {
  const { icon: Icon, theme, label, subLabel } = resolveNodeConfig(data.templateId || data.iconKey)
  const isOverloaded = data.ui?.overloadPreview
  const safeColor = theme.bg || 'bg-nss-primary'
  const safeText = theme.text || safeColor.replace('bg-', 'text-')

  return (
    <div className="p-5 border-b border-nss-border bg-nss-panel">
      <div className="flex items-center gap-4">
        <div
          className={`
          shrink-0 transition-all duration-300 rounded-lg shadow-sm flex items-center justify-center
          ${
            isOverloaded
              ? 'p-2 bg-nss-danger/10 border-nss-danger/30 text-nss-danger ring-1 ring-nss-danger/30'
              : `p-1.5 rounded ${safeColor} bg-opacity-30 dark:bg-opacity-30`
          }
        `}
        >
          <Icon size={24} className={!isOverloaded ? `${safeText} dark:!text-nss-bg` : ''} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h2
              className={`font-semibold text-sm leading-tight truncate pr-2 ${isOverloaded ? 'text-nss-danger' : 'text-nss-text'}`}
            >
              {data.label || label}
            </h2>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-nss-muted font-mono uppercase truncate">
              {data.subLabel || subLabel}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-nss-border bg-nss-surface text-nss-muted uppercase tracking-wide">
              {data.profile}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
