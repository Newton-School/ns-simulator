import { memo, useCallback } from 'react'
import { NodeProps } from 'reactflow'
import { NodeHeader } from '@renderer/components/nodes/NodeHeader'
import { NodeSettingsMenu } from '@renderer/components/nodes/NodeSettingsMenu'
import { ProgressBar } from '@renderer/components/ui/ProgressBar'
import { MetricItem } from '@renderer/components/properties/MetricItem'
import { SecurityNodeData } from '@renderer/types/ui'
import { resolveNodeConfig } from '@renderer/config/nodeRegistry'
import { useNodeMetrics } from '@renderer/hooks/useNodeMetrics'
import BaseNode from '@renderer/components/nodes/BaseNode'
import { useFlowStore } from '@renderer/components/canvas/hooks/useFlowStore'

const SecurityNode = ({ id, data, selected }: NodeProps<SecurityNodeData>) => {
  const { updateNodeData } = useFlowStore()
  // Icon resolved from the shared registry — no local ICON_LOOKUP needed
  const { icon: IconComponent } = resolveNodeConfig(data.iconKey)

  const handleLabelChange = useCallback(
    (newLabel: string) => {
      updateNodeData(id, { label: newLabel })
    },
    [id, updateNodeData]
  )

  const { utilization } = useNodeMetrics(id, { utilization: data.load })

  return (
    <BaseNode id={id} selected={selected} selectionVariant="warning">
      {({ isMenuOpen, onMenuClose, onMenuToggle }) => (
        <>
          <NodeHeader
            label={data.label || 'Security Element'}
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
              {data.blockRate !== undefined && (
                <MetricItem
                  label="Block Rate"
                  value={data.blockRate}
                  unit="%"
                  textColor="text-nss-warning"
                />
              )}
              {data.droppedPackets !== undefined && (
                <MetricItem
                  label="Dropped Pkts"
                  value={data.droppedPackets}
                  unit="%"
                  textColor="text-nss-danger"
                />
              )}
              {data.activeThreats !== undefined && (
                <MetricItem
                  label="Active Threats"
                  value={data.activeThreats}
                  unit=""
                  textColor="text-nss-danger"
                />
              )}
            </div>
            <ProgressBar label="CPU Load" value={utilization} />
          </div>
        </>
      )}
    </BaseNode>
  )
}

export default memo(SecurityNode)
