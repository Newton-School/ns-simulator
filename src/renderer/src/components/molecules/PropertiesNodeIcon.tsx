import { clsx } from 'clsx'
import { resolveNodeConfig } from '@renderer/config/nodeRegistry'

interface NodeIconProps {
  iconKey: string
  size?: number
}

export const PropertiesNodeIcon = ({ iconKey, size = 20 }: NodeIconProps) => {
  const { icon: Icon, theme } = resolveNodeConfig(iconKey)

  return (
    <div
      className={clsx(
        'w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm shrink-0 transition-colors',
        `${theme.bg} border-transparent`
      )}
    >
      <Icon size={size} />
    </div>
  )
}
