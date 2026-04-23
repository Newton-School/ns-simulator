import { useState } from 'react'
import { Search } from 'lucide-react'
import { CATALOG_CONFIG } from '../../config/catalogConfig'
import { LibraryItem } from './LibraryItem'

type Filter = 'all' | 'common'

const COMMON_IDS = new Set([
  'client-user',
  'api-gateway',
  'load-balancer-l7',
  'cdn',
  'backend-server',
  'auth-service',
  'primary-db',
  'redis-cache',
  'message-queue',
  'read-replica'
])

export const LibrarySidebar = () => {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const trimmed = query.trim().toLowerCase()

  const filtered = CATALOG_CONFIG.map((category) => ({
    ...category,
    items: category.items.filter((item) => {
      const matchesFilter = filter === 'all' || COMMON_IDS.has(item.id)
      const matchesSearch =
        !trimmed ||
        item.label.toLowerCase().includes(trimmed) ||
        item.subLabel.toLowerCase().includes(trimmed)
      return matchesFilter && matchesSearch
    })
  })).filter((category) => category.items.length > 0)

  return (
    <aside className="h-full w-full bg-nss-panel border-r border-nss-border flex flex-col transition-colors duration-200">
      {/* Sidebar Header */}
      <div className="p-4 pb-3 border-b border-nss-border shrink-0 space-y-3">
        <h2 className="text-xs font-bold text-nss-muted uppercase tracking-widest">
          Component Library
        </h2>

        {/* Search */}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nss-muted pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components…"
            className="
              w-full h-7 pl-7 pr-3 rounded-md text-xs font-sans
              bg-nss-input-bg border border-nss-border text-nss-text
              placeholder:text-nss-muted outline-none
              focus:border-nss-primary transition-colors
            "
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-nss-bg rounded-md p-0.5">
          {(['common', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                flex-1 h-6 rounded text-[11px] font-semibold capitalize transition-colors
                ${
                  filter === f
                    ? 'bg-nss-surface text-nss-text shadow-sm'
                    : 'text-nss-muted hover:text-nss-text'
                }
              `}
            >
              {f === 'common' ? 'Common' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {filtered.length > 0 ? (
          filtered.map((category) => (
            <div key={category.id}>
              <h3 className="px-2 mb-2 text-[10px] font-bold text-nss-muted uppercase opacity-80">
                {category.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {category.items.map((item) => (
                  <LibraryItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="px-2 pt-4 text-xs text-nss-muted text-center">
            No components match "{query}"
          </p>
        )}
      </div>
    </aside>
  )
}
