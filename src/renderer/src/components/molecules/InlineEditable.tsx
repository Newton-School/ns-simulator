import { useState, useRef, useEffect, KeyboardEvent, memo } from 'react'

interface InlineEditableLabelProps {
  value: string
  onSave: (newValue: string) => void
  textClassName?: string
  inputClassName?: string
}

export const InlineEditableLabel = memo(
  ({ value, onSave, textClassName = '', inputClassName = '' }: InlineEditableLabelProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      setEditValue(value)
    }, [value])

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }, [isEditing])

    const saveAndClose = () => {
      setIsEditing(false)
      const trimmed = editValue.trim()
      if (trimmed && trimmed !== value) {
        onSave(trimmed)
      } else {
        setEditValue(value)
      }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') saveAndClose()
      if (e.key === 'Escape') {
        setIsEditing(false)
        setEditValue(value)
      }
    }

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveAndClose}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className={`nodrag outline-none bg-transparent text-nss-text border border-nss-primary rounded px-1 ${inputClassName}`}
        />
      )
    }

    return (
      <span
        onDoubleClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
        title="Double click to rename"
        className={`cursor-text text-nss-text hover:bg-nss-surface px-1 -ml-1 rounded transition-colors truncate ${textClassName}`}
      >
        {value}
      </span>
    )
  }
)

InlineEditableLabel.displayName = 'InlineEditableLabel'
