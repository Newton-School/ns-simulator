import { memo, useCallback } from 'react'
import { NodeProps } from 'reactflow'
import { NodeHeader } from '@renderer/components/nodes/NodeHeader'
import { NodeSettingsMenu } from '@renderer/components/nodes/NodeSettingsMenu'
import { ProgressBar } from '@renderer/components/ui/ProgressBar'
import { MetricItem } from '@renderer/components/properties/MetricItem'
import { ServiceNodeData } from '@renderer/types/ui'
import { resolveNodeConfig } from '@renderer/config/nodeRegistry'
import { useNodeMetrics } from '@renderer/hooks/useNodeMetrics'
import BaseNode from '@renderer/components/nodes/BaseNode'
import { useFlowStore } from '@renderer/components/canvas/hooks/useFlowStore'

const ServiceNode = ({ id, data, selected }: NodeProps<ServiceNodeData>) => {
  const { updateNodeData } = useFlowStore()
  const { icon: IconComponent } = resolveNodeConfig(data.iconKey)

  const handleLabelChange = useCallback(
    (newLabel: string) => {
      updateNodeData(id, { label: newLabel })
    },
    [id, updateNodeData]
  )

  const { throughput, errorRate, queueDepth, utilization, hasRuntime, active } = useNodeMetrics(
    id,
    {
      throughput: data.throughput,
      errorRate: data.errorRate,
      queueDepth: data.queueDepth,
      utilization: data.load
    }
  )

  // After a simulation run, nodes that received zero post-warmup traffic are
  // visually muted so users can see at a glance which nodes stayed inactive.
  const isInactive = hasRuntime && active === false

  return (
    <BaseNode id={id} selected={selected} selectionVariant="primary">
      {({ isMenuOpen, onMenuClose, onMenuToggle }) => (
        <div className={isInactive ? 'opacity-40 grayscale' : undefined}>
          <NodeHeader
            label={data.label || 'Service'}
            icon={IconComponent}
            status={data.status}
            color={data.color}
            onLabelChange={handleLabelChange}
          >
            <NodeSettingsMenu
              nodeId={id}
              isOpen={isMenuOpen}
              onClose={onMenuClose}
              onToggle={onMenuToggle}
            />
          </NodeHeader>

          <div className="p-4">
            {isInactive ? (
              <p className="text-[10px] text-nss-muted italic text-center py-2">
                No post-warmup traffic
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <MetricItem
                    label="Throughput"
                    value={throughput !== undefined ? String(throughput) : undefined}
                    unit="req/s"
                  />
                  <MetricItem
                    label="Error Rate"
                    value={errorRate !== undefined ? String(errorRate) : undefined}
                    unit="%"
                    textColor="text-nss-danger"
                  />
                  <MetricItem
                    label="Queue Depth"
                    value={queueDepth !== undefined ? String(queueDepth) : undefined}
                    unit="req"
                    textColor="text-nss-warning"
                  />
                </div>
                <ProgressBar label="Utilization" value={utilization} />
              </>
            )}
          </div>
        </div>
      )}
    </BaseNode>
  )
}

export default memo(ServiceNode)
