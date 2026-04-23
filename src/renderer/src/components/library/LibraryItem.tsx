import React from 'react'
import { CatalogItem } from '@renderer/types/ui'

interface LibraryItemProps {
  item: CatalogItem
}

export const LibraryItem = ({ item }: LibraryItemProps) => {
  const { icon: Icon, label, subLabel, color, type, data, id } = item
  const { bg, text } = color

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow/type', type)
    event.dataTransfer.setData(
      'application/reactflow/data',
      JSON.stringify({
        label,
        color,
        ...data,
        registryId: id
      })
    )
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={subLabel}
      className="
        group flex flex-col items-center gap-1.5 p-1.5 rounded-lg
        cursor-grab active:cursor-grabbing select-none
        bg-transparent hover:bg-nss-surface
        border border-transparent hover:border-nss-border
        transition-all duration-200
      "
    >
      {/* Icon tile */}
      <div
        className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${bg} bg-opacity-30 group-hover:bg-opacity-40 transition-all
        `}
      >
        <Icon size={16} className={text} />
      </div>

      {/* Label */}
      <span className="text-[10px] font-medium text-nss-text text-center leading-tight line-clamp-2 w-full">
        {label}
      </span>
    </div>
  )
}
