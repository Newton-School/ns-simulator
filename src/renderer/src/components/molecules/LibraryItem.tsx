import React from 'react';
import { CatalogItem } from '../../config/catalogConfig';

interface LibraryItemProps {
  item: CatalogItem;
}

export const LibraryItem = ({ item }: LibraryItemProps) => {
  const { icon: Icon, label, subLabel, color, type, data } = item;

  const onDragStart = (event: React.DragEvent) => {
    // 1. Set the Node Type (for React Flow to know what component to render)
    event.dataTransfer.setData('application/reactflow/type', type);
    
    // 2. Set the Node Data (Initial state like status, metrics, etc.)
    // We include the label here so the node knows its name immediately
    event.dataTransfer.setData('application/reactflow/data', JSON.stringify({ label, ...data }));
    
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="
        group flex items-start gap-3 p-3 rounded 
        cursor-grab active:cursor-grabbing select-none 
        hover:bg-[#1F242C] transition-all duration-200
        border border-transparent hover:border-[#2A303C]
      "
    >
      {/* Icon Well */}
      <div className={`p-2 rounded bg-opacity-40 ${color} shrink-0 transition-transform group-hover:scale-110`}>
        <Icon size={18} className={color.replace('bg-', 'text-')} />
      </div>

      {/* Text Content */}
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
          {label}
        </span>
        <span className="text-[10px] text-slate-500 truncate mt-0.5">
          {subLabel}
        </span>
      </div>
    </div>
  );
};