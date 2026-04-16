import { Settings } from 'lucide-react'
import type { AnyNodeDataKey, AnyNodeDataValue } from '@renderer/types/ui'

// --- Store & Config ---
import useStore from '../../store/useStore'

// --- Organisms (The building blocks) ---
import { PropertiesHeader } from './PropertiesHeader'
import { PropertiesForm } from './PropertiesForm'

const EmptyState = () => (
  <div className="h-full bg-nss-panel border-l border-nss-border flex flex-col items-center justify-center text-nss-muted gap-2">
    <Settings size={24} className="opacity-20" />
    <p className="text-xs font-medium uppercase tracking-wide">No Selection</p>
  </div>
)

export const PropertiesPanel = () => {
  const nodes = useStore((state) => state.nodes)
  const updateNodeField = useStore((state) => state.updateNodeField)

  const selectedNode = nodes.find((n) => n.selected)

  if (!selectedNode) return <EmptyState />

  const { data, id } = selectedNode

  const handleUpdate = <K extends AnyNodeDataKey>(key: K, value: AnyNodeDataValue<K>) => {
    updateNodeField(id, key, value)
  }

  return (
    <div className="h-full w-full bg-nss-panel border-l border-nss-border flex flex-col text-nss-text font-sans shadow-xl">
      {/* --- ORGANISM: HEADER --- */}
      {/* Encapsulates Icon, Title, Badge, and ID rendering */}
      <PropertiesHeader data={{ ...data, id }} />

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-nss-panel">
        {/* --- ORGANISM: FORM --- */}
        {/* Encapsulates the complex looping, grouping, and input selection logic */}
        <PropertiesForm data={data} onUpdate={handleUpdate} />
      </div>

      {/* --- FOOTER --- */}
      {/* <div className="p-4 border-t border-nss-border bg-nss-surface shrink-0">
        <div className="flex justify-between items-center text-[10px] text-nss-muted font-mono">
          <span>UUID: {id.split('-')[0]}...</span>
          <span>v1.2.0</span>
        </div>
      </div> */}
    </div>
  )
}
