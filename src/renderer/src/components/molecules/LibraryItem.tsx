import React from 'react'
import { CatalogItem } from '@renderer/types/ui'

interface LibraryItemProps {
  item: CatalogItem
}

export const LibraryItem = ({ item }: LibraryItemProps) => {
  const { icon: Icon, label, subLabel, color, type, data } = item
  const { bg, text } = color

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow/type', type)
    event.dataTransfer.setData(
      'application/reactflow/data',
      JSON.stringify({
        label,
        color: bg,
        ...data
      })
    )

    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="
        group flex items-start gap-3 p-3 rounded 
        cursor-grab active:cursor-grabbing select-none 
        bg-transparent hover:bg-nss-surface 
        border border-transparent hover:border-nss-border
        transition-all duration-200
      "
    >
      {/* Icon Well */}
      <div
        className={`p-2 rounded bg-opacity-40 group-hover:bg-opacity-20 ${bg} shrink-0 transition-all`}
      >
        <Icon size={18} className={text} />
      </div>

      {/* Text Content */}
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-medium text-nss-text truncate transition-colors">
          {label}
        </span>
        <span className="text-[10px] text-nss-muted truncate mt-0.5">{subLabel}</span>
      </div>
    </div>
  )
}
