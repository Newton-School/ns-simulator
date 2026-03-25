import React, { memo, useState, useCallback, useMemo } from 'react'
import { Position, NodeProps } from 'reactflow'
import { LucideIcon, Shield, ShieldAlert, Lock, ShieldCheck } from 'lucide-react'

import UniversalHandle from '@renderer/components/atoms/UniversalHandle'
import { ProgressBar } from '@renderer/components/atoms/ProgressBar'
import { NodeHeader } from '@renderer/components/molecules/NodeHeader'
import { MetricItem } from '@renderer/components/molecules/MetricItem'
import { NodeSettingsMenu } from '@renderer/components/molecules/NodeSettingsMenu'
import { SecurityNodeData } from '@renderer/types/ui'

const OFFSETS = ['25%', '50%', '75%']
const POSITIONS = [Position.Left, Position.Top, Position.Right, Position.Bottom]

const ICON_LOOKUP: Record<string, LucideIcon> = {
  waf: Shield,
  firewall: ShieldAlert,
  securityGroup: ShieldCheck,
  default: Lock
}

const SecurityNode = ({ id, data, selected }: NodeProps<SecurityNodeData>) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const IconComponent = ICON_LOOKUP[data.iconKey] || ICON_LOOKUP.default

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsMenuOpen(true)
  }, [])

  const handleMenuClose = useCallback(() => setIsMenuOpen(false), [])

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen((prev) => !prev)
  }, [])

  // Distinct styling for security nodes - more protective/alert color scheme when selected
  const containerClasses = useMemo(
    () => `
    group relative w-64 bg-nss-surface rounded-lg transition-all duration-200
    overflow-visible
    ${
      selected
        ? 'ring-2 ring-nss-warning shadow-[0_0_20px_rgba(245,158,11,0.3)]' // Amber/Warning glow instead of blue
        : 'border border-nss-border hover:border-nss-warning/30 shadow-xl'
    }
  `,
    [selected]
  )

  return (
    <div onContextMenu={handleContextMenu} className={containerClasses}>
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

      <NodeHeader
        label={data.label || 'Security Element'}
        icon={IconComponent}
        status={data.status}
        color={data.color}
      >
        <NodeSettingsMenu
          nodeId={id}
          isOpen={isMenuOpen}
          onClose={handleMenuClose}
          onToggle={handleMenuToggle}
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

        {data.load !== undefined && <ProgressBar label="CPU Load" value={data.load} />}
      </div>
    </div>
  )
}

export default memo(SecurityNode)
