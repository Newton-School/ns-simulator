import { CATALOG_CONFIG } from '../../config/catalogConfig';
import { LibraryItem } from '../molecules/LibraryItem';

export const LibrarySidebar = () => {
  return (
    <aside className="h-full w-full bg-nss-panel border-r border-nss-border flex flex-col transition-colors duration-200">

      {/* Sidebar Header */}
      <div className="p-4 border-b border-nss-border shrink-0">
        <h2 className="text-xs font-bold text-nss-muted uppercase tracking-widest">
          Component Library
        </h2>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        {CATALOG_CONFIG.map((category) => (
          <div key={category.id}>
            {/* Category Header */}
            <h3 className="px-2 mb-2 text-[10px] font-bold text-nss-muted uppercase opacity-80">
              {category.title}
            </h3>

            {/* Items Grid/List */}
            <div className="space-y-1">
              {category.items.map((item) => (
                <LibraryItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};