import React from 'react';
import { CATALOG_ITEMS, CatalogItem } from '../../config/catalogConfig';

// --- Sub-Component ---
const DraggableItem = ({ item }: { item: CatalogItem }) => {

  const onDragStart = (event: React.DragEvent, item: CatalogItem) => {
    const itemData = JSON.stringify(item);
    event.dataTransfer.setData('application/reactflow', itemData);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="
        group relative
        flex flex-col items-center justify-center 
        p-3 gap-2
        bg-white border border-gray-200 rounded-lg 
        cursor-grab select-none 
        transition-all duration-200
        hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5
        active:cursor-grabbing active:scale-95
      "
      onDragStart={(event) => onDragStart(event, item)}
      draggable
    >
      <div className={`w-8 h-8 rounded-full ${item.color} shadow-sm flex items-center justify-center text-white text-[10px] font-bold`}>
        {item.label.substring(0, 2).toUpperCase()}
      </div>

      <div className="flex flex-col items-center text-center w-full">
        <span className="text-xs font-semibold text-gray-700 leading-tight truncate w-full px-1">
          {item.label}
        </span>
        {item.description && (
          <span className="text-[10px] text-gray-400 leading-tight mt-1 truncate w-full px-1">
            {item.description}
          </span>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---
export const ComponentCatalog = () => {
  return (
    <aside className="h-full w-full bg-gray-50 border-r border-gray-300 flex flex-col">
      {/* 'minmax(100px, 1fr)' creates columns that are at least 100px wide, but stretch to fill space */}
      <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3 overflow-y-auto">
        {CATALOG_ITEMS.map((item) => (
          <DraggableItem key={item.type} item={item} />
        ))}
      </div>
    </aside>
  );
};