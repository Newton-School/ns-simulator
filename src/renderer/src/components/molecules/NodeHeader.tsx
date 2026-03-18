import { memo, useState, useRef, useEffect, KeyboardEvent } from 'react'
import { LucideIcon, HelpCircle } from 'lucide-react'

interface NodeHeaderProps {
  label: string
  icon: LucideIcon
  status?: 'healthy' | 'degraded' | 'critical'
  color?: string
  onLabelChange?: (newLabel: string) => void
  children?: React.ReactNode
}

export const NodeHeader = memo(
  ({ label, icon: Icon, status = 'healthy', color, onLabelChange, children }: NodeHeaderProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(label)
    const inputRef = useRef<HTMLInputElement>(null)

    const statusColors = {
      healthy: 'bg-nss-success shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      degraded: 'bg-nss-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]',
      critical: 'bg-nss-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]'
    }

    const safeColor = color || 'bg-nss-primary'
    const SafeIcon = Icon || HelpCircle

    useEffect(() => {
      setEditValue(label)
    }, [label])

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [isEditing])

    const handleSave = () => {
      setIsEditing(false)
      if (onLabelChange && editValue.trim() && editValue !== label) {
        onLabelChange(editValue.trim())
      } else {
        setEditValue(label) // Revert if empty or unchanged
      }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') {
        setIsEditing(false)
        setEditValue(label)
      }
    }

    return (
      <div className="bg-nss-panel p-3 border-b border-nss-border flex justify-between items-center rounded-t-lg">
        {/* Left Side: Icon + Label */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`p-1.5 rounded bg-opacity-50 ${safeColor} shrink-0 flex items-center justify-center`}
          >
            <SafeIcon size={16} className={safeColor.replace('bg-', 'text-')} />
          </div>

          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="nodrag font-bold text-sm bg-nss-bg text-nss-text border border-nss-primary rounded px-1 w-24 outline-none"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="font-bold text-sm text-nss-text truncate max-w-[120px] cursor-text hover:bg-nss-surface px-1 -ml-1 rounded transition-colors"
              title="Double click to rename"
            >
              {label}
            </span>
          )}
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
