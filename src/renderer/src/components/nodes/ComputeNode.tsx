import { memo, useCallback, useMemo } from 'react'
import { NodeProps } from 'reactflow'
import { ComputeNodeData } from '@renderer/types/ui'
import { resolveNodeConfig } from '@renderer/config/nodeRegistry'
import { ProgressBar } from '@renderer/components/ui/ProgressBar'
import { useNodeMetrics } from '@renderer/hooks/useNodeMetrics'
import BaseNode from '@renderer/components/nodes/BaseNode'
import { InlineEditableLabel } from '@renderer/components/properties/InlineEditable'
import { useFlowStore } from '@renderer/components/canvas/hooks/useFlowStore'

const ComputeNode = ({ id, data, selected }: NodeProps<ComputeNodeData>) => {
  const { updateNodeData } = useFlowStore()
  const { icon: Icon, theme } = resolveNodeConfig(data.computeType)
  const isOverloaded = data.isOverloaded

  const handleLabelChange = useCallback(
    (newLabel: string) => {
      updateNodeData(id, { label: newLabel })
    },
    [id, updateNodeData]
  )

  const {
    utilization,
    queueDepth: runtimeQueueDepth,
    hasRuntime,
    active
  } = useNodeMetrics(id, {
    utilization: data.utilization,
    queueDepth: data.queueDepth
  })

  // After a simulation run, nodes that received zero post-warmup traffic are
  // visually muted so users can see at a glance which nodes were bypassed.
  const isInactive = hasRuntime && active === false

  const resolvedQueueDepth =
    runtimeQueueDepth !== undefined ? Math.max(0, Math.round(runtimeQueueDepth)) : data.queueDepth

  const safeColor = theme.bg || 'bg-nss-primary'
  const badgeClass =
    resolvedQueueDepth > 50
      ? 'bg-nss-danger/20 text-nss-danger'
      : 'bg-nss-primary/20 text-nss-primary'

  const containerClassName = useMemo(() => {
    const base = 'group relative min-w-[180px] bg-nss-surface rounded-lg border-2'
    if (isInactive) return `${base} border-nss-border opacity-40 grayscale`
    if (isOverloaded)
      return `${base} border-nss-danger shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse`
    if (selected) return `${base} border-nss-primary shadow-lg`
    return `${base} border-nss-border hover:border-nss-muted`
  }, [isInactive, isOverloaded, selected])

  return (
    <BaseNode id={id} selected={selected} containerClassName={containerClassName}>
      {() => (
        <>
          <div className="flex items-center gap-3 p-3 border-b border-nss-border bg-nss-panel rounded-t-lg">
            <div
              className={`
                p-2 rounded-md flex items-center justify-center shrink-0
                ${
                  isOverloaded
                    ? 'bg-nss-danger/10 border-nss-danger/30 text-nss-danger'
                    : `bg-opacity-50 ${safeColor}`
                }
              `}
            >
              <Icon size={16} />
            </div>

            <div className="flex flex-col overflow-hidden w-full">
              <InlineEditableLabel
                value={data.label || 'Compute'}
                onSave={handleLabelChange}
                textClassName="text-xs font-bold uppercase tracking-wide w-full"
                inputClassName="text-xs font-bold uppercase tracking-wide w-full"
              />
              <span className="text-[10px] text-nss-muted font-mono px-1">{data.computeType}</span>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {isInactive ? (
              <p className="text-[10px] text-nss-muted italic text-center py-1">
                Not in source path
              </p>
            ) : (
              <>
                <ProgressBar label="Utilization" value={utilization} />

                <div className="flex items-center justify-between p-2 rounded bg-nss-bg border border-nss-border">
                  <span className="text-[10px] text-nss-muted font-medium">Queue Depth</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                    {resolvedQueueDepth} reqs
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </BaseNode>
  )
}

export default memo(ComputeNode)
