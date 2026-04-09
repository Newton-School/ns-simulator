import React, { memo, useState, useCallback, useMemo } from 'react'
import { Position, NodeProps } from 'reactflow'
import {
  Server,
  Globe,
  Cpu,
  Database,
  Network,
  LucideIcon,
  Monitor,
  Navigation,
  Wifi,
  Inbox,
  Radio,
  Layers,
  GitBranch,
  HardDrive,
  Search,
  ExternalLink,
  Router,
  LockKeyhole,
  Waypoints,
  ArrowRightLeft,
  Activity,
  FileText,
  Library,
  Radar,
  BellRing,
  HeartPulse,
  ServerCog,
  BookOpen,
  Bell,
  LineChart
} from 'lucide-react'

import UniversalHandle from '@renderer/components/ui/UniversalHandle'
import { ProgressBar } from '@renderer/components/ui/ProgressBar'
import { NodeHeader } from '@renderer/components/nodes/NodeHeader'
import { MetricItem } from '@renderer/components/properties/MetricItem'
import { NodeSettingsMenu } from '@renderer/components/nodes/NodeSettingsMenu'
import { ServiceNodeData } from '@renderer/types/ui'
import { useFlowStore } from '../canvas/hooks/useFlowStore'

const OFFSETS = ['25%', '50%', '75%']
const POSITIONS = [Position.Left, Position.Top, Position.Right, Position.Bottom]

const ICON_LOOKUP: Record<string, LucideIcon> = {
  // Existing
  globe: Globe,
  cpu: Cpu,
  database: Database,
  server: Server,
  network: Network,
  nat: Router,
  vpn: LockKeyhole,
  ingress: Waypoints,
  proxy: ArrowRightLeft,
  'server-cog': ServerCog,
  'book-open': BookOpen,
  //Routing
  'routing-rule': GitBranch,
  'routing-policy': Waypoints,
  // Clients & Edge
  monitor: Monitor,
  dns: Navigation,
  cdn: Wifi,
  // Messaging
  queue: Inbox,
  broker: Radio,
  // Data Stores
  nosql: Layers,
  replica: GitBranch,
  storage: HardDrive,
  search: Search,
  // App Support
  notification: Bell,
  analytics: LineChart,
  // External
  external: ExternalLink,
  // Observability
  'metrics-collector': Activity,
  'log-collector': FileText,
  'log-aggregator': Library,
  tracing: Radar,
  alerting: BellRing,
  'health-check': HeartPulse
}

const ServiceNode = ({ id, data, selected }: NodeProps<ServiceNodeData>) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const { updateNodeData } = useFlowStore()
  const IconComponent = ICON_LOOKUP[data.iconKey] || Server

  const handleLabelChange = useCallback(
    (newLabel: string) => {
      updateNodeData(id, { label: newLabel })
    },
    [id, updateNodeData]
  )

  const containerClasses = useMemo(
    () => `
    group relative w-64 bg-nss-surface rounded-lg transition-all duration-200
    overflow-visible
    ${
      selected
        ? 'ring-2 ring-nss-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]'
        : 'border border-nss-border hover:border-nss-muted/30 shadow-xl'
    }
  `,
    [selected]
  )

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault()
        setIsMenuOpen(true)
      }}
      className={containerClasses}
    >
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
        label={data.label || 'Service'}
        icon={IconComponent}
        status={data.status}
        color={data.color}
        onLabelChange={handleLabelChange}
      >
        <NodeSettingsMenu
          nodeId={id}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onToggle={(e) => {
            e.stopPropagation()
            setIsMenuOpen((prev) => !prev)
          }}
        />
      </NodeHeader>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <MetricItem label="Throughput" value={data.throughput} unit="req/s" />
          <MetricItem
            label="Error Rate"
            value={data.errorRate}
            unit="%"
            textColor="text-nss-danger"
          />
          <MetricItem
            label="Queue Depth"
            value={data.queueDepth}
            unit="ms"
            textColor="text-nss-warning"
          />
        </div>
        <ProgressBar label="CPU Load" value={data.load} />
      </div>
    </div>
  )
}

export default memo(ServiceNode)
