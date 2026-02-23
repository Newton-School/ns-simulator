import { memo } from 'react'
import { MoreVertical } from 'lucide-react'

interface MenuTriggerProps {
  isOpen: boolean
  onClick: (e: React.MouseEvent) => void
  ref?: React.Ref<HTMLButtonElement>
}

export const MenuTrigger = memo(
  ({ isOpen, onClick, ref }: MenuTriggerProps & { ref?: React.Ref<HTMLButtonElement> }) => (
    <button
      ref={ref}
      onClick={onClick}
      className={`
        p-1 rounded-md transition-colors duration-200 outline-none
        ${
          isOpen
            ? 'bg-nss-surface text-nss-primary'
            : 'text-nss-muted hover:text-nss-text hover:bg-nss-surface'
        }
      `}
      title="Settings"
    >
      <MoreVertical size={16} />
    </button>
  )
)
MenuTrigger.displayName = 'MenuTrigger'
