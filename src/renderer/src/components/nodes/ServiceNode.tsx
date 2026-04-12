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
  // Icon and theme resolved from the shared registry — no local ICON_LOOKUP needed
  const { icon: IconComponent } = resolveNodeConfig(data.iconKey)

  const handleLabelChange = useCallback(
    (newLabel: string) => {
      updateNodeData(id, { label: newLabel })
    },
    [id, updateNodeData]
  )

  const { throughput, errorRate, queueDepth, utilization } = useNodeMetrics(id, {
    throughput: data.throughput,
    errorRate: data.errorRate,
    queueDepth: data.queueDepth,
    utilization: data.load
  })

  return (
    <BaseNode id={id} selected={selected} selectionVariant="primary">
      {({ isMenuOpen, onMenuClose, onMenuToggle }) => (
        <>
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
            <div className="grid grid-cols-2 gap-4 mb-3">
              <MetricItem
                label="Throughput"
                value={throughput !== undefined ? throughput.toFixed(1) : undefined}
                unit="req/s"
              />
              <MetricItem
                label="Error Rate"
                value={errorRate !== undefined ? errorRate.toFixed(2) : undefined}
                unit="%"
                textColor="text-nss-danger"
              />
              <MetricItem
                label="Queue Depth"
                value={queueDepth !== undefined ? queueDepth.toFixed(1) : undefined}
                unit="req"
                textColor="text-nss-warning"
              />
            </div>
            <ProgressBar label="CPU Utilization" value={utilization} />
          </div>
        </>
      )}
    </BaseNode>
  )
}

export default memo(ServiceNode)
