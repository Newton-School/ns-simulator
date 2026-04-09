import React, { memo, useMemo } from 'react'
import { Position, NodeProps } from 'reactflow'
import { ComputeNodeData } from '@renderer/types/ui'
import { resolveNodeConfig } from '@renderer/config/nodeRegistry'
import { ProgressBar } from '@renderer/components/ui/ProgressBar'
import UniversalHandle from '@renderer/components/ui/UniversalHandle'
import { InlineEditableLabel } from '../properties/InlineEditable'
import { useFlowStore } from '../canvas/hooks/useFlowStore'

const OFFSETS = ['25%', '50%', '75%']
const POSITIONS = [Position.Left, Position.Top, Position.Right, Position.Bottom]

const ComputeNode = ({ id, data, selected }: NodeProps<ComputeNodeData>) => {
  const { updateNodeData } = useFlowStore()
  const { icon: Icon, theme } = resolveNodeConfig(data.computeType)
  const isOverloaded = data.is_overloaded

  const handleSaveLabel = (newLabel: string) => {
    updateNodeData(id, { label: newLabel })
  }

  const containerClasses = useMemo(() => {
    const base =
      'group relative min-w-[180px] bg-nss-surface rounded-lg border-2 transition-all duration-200'
    if (isOverloaded)
      return `${base} border-nss-danger shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse`
    if (selected) return `${base} border-nss-primary shadow-lg`
    return `${base} border-nss-border hover:border-nss-muted`
  }, [isOverloaded, selected])

  const safeColor = theme.bg || 'bg-nss-primary'
  const badgeClass =
    data.queue_depth > 50
      ? 'bg-nss-danger/20 text-nss-danger'
      : 'bg-nss-primary/20 text-nss-primary'
  const currentLabel = data.label || 'Compute'

  return (
    <div className={containerClasses}>
      {POSITIONS.map((pos) => (
        <React.Fragment key={pos}>
          {OFFSETS.map((offset, i) => (
            <UniversalHandle
              key={`${pos}-${i}`}
              id={`${pos}-${i}`}
              position={pos}
              offset={offset}
            />
          ))}
        </React.Fragment>
      ))}

      <div className="flex items-center gap-3 p-3 border-b border-nss-border bg-nss-panel rounded-t-lg">
        <div
          className={`p-2 rounded-md flex items-center justify-center shrink-0 transition-colors ${
            isOverloaded
              ? 'bg-nss-danger/10 border-nss-danger/30 text-nss-danger'
              : `bg-opacity-50 ${safeColor}`
          }`}
        >
          <Icon size={16} />
        </div>

        <div className="flex flex-col overflow-hidden w-full">
          <InlineEditableLabel
            value={currentLabel}
            onSave={handleSaveLabel}
            textClassName="text-xs font-bold uppercase tracking-wide w-full"
            inputClassName="text-xs font-bold uppercase tracking-wide w-full"
          />
          <span className="text-[10px] text-nss-muted font-mono px-1">{data.computeType}</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <ProgressBar label="Utilization" value={data.cpu_usage} />

        <div className="flex items-center justify-between p-2 rounded bg-nss-bg border border-nss-border">
          <span className="text-[10px] text-nss-muted font-medium">Queue Depth</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${badgeClass}`}
          >
            {data.queue_depth} reqs
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(ComputeNode)
