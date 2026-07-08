import { memo, useCallback } from 'react'
import { NodeProps } from 'reactflow'
import { NodeHeader } from '@renderer/components/nodes/NodeHeader'
import { NodeSettingsMenu } from '@renderer/components/nodes/NodeSettingsMenu'
import { ServiceNodeData } from '@renderer/types/ui'
import { resolveNodeConfig } from '@renderer/config/nodeRegistry'
import { useNodeMetrics } from '@renderer/hooks/useNodeMetrics'
import { useMetricLens } from '@renderer/hooks/useMetricLens'
import BaseNode from '@renderer/components/nodes/BaseNode'
import { useFlowStore } from '@renderer/components/canvas/hooks/useFlowStore'
import { LensMetricCard } from './LensMetricCard'
import {
  getEffectiveNodeStatus,
  getIdentityChip,
  getLensCard,
  isRuntimeNodeInactive
} from './nodePresentation'

const ServiceNode = ({ id, data, selected }: NodeProps<ServiceNodeData>) => {
  const { updateNodeData } = useFlowStore()
  const { icon: IconComponent, theme } = resolveNodeConfig(data.templateId || data.iconKey)

  const handleLabelChange = useCallback(
    (newLabel: string) => {
      updateNodeData(id, { label: newLabel })
    },
    [id, updateNodeData]
  )

  const metrics = useNodeMetrics(id)
  const { errorRate, queueDepth, utilization, hasRuntime, active } = metrics
  const lens = useMetricLens()
  const identityChip = getIdentityChip(data)
  const lensCard = hasRuntime ? getLensCard(lens, data, metrics) : null
  const status = getEffectiveNodeStatus(data, { utilization, errorRate, queueDepth }, hasRuntime)

  // After a simulation run, nodes that received zero post-warmup traffic are
  // visually muted so users can see at a glance which nodes stayed inactive.
  const isInactive = isRuntimeNodeInactive(hasRuntime, active)

  return (
    <BaseNode
      id={id}
      selected={selected}
      selectionVariant="primary"
      healthStatus={isInactive ? undefined : status}
    >
      {({ isMenuOpen, onMenuClose, onMenuToggle }) => (
        <div className={isInactive ? 'opacity-40 grayscale' : undefined}>
          <NodeHeader
            label={data.label || 'Service'}
            icon={IconComponent}
            status={status}
            color={theme}
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
            ) : lensCard ? (
              <LensMetricCard card={lensCard} />
            ) : identityChip ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] text-nss-muted uppercase tracking-wider font-semibold">
                  {identityChip.label}
                </span>
                <span className="font-mono text-xs text-nss-text">{identityChip.value}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </BaseNode>
  )
}

export default memo(ServiceNode)
