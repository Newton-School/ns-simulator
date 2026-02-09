import { memo, useState, useCallback } from 'react';
import { Position, NodeProps } from 'reactflow';
import { Server, Globe, Cpu, Database, Network } from 'lucide-react';

import { NodeHandle } from '@renderer/components/atoms/NodeHandle';
import { ProgressBar } from '@renderer/components/atoms/ProgressBar';
import { NodeHeader } from '@renderer/components/molecules/NodeHeader';
import { MetricItem } from '@renderer/components/molecules/MetricItem';
import { NodeSettingsMenu } from '@renderer/components/molecules/NodeSettingsMenu';

const ICON_LOOKUP: Record<string, any> = {
  globe: Globe,
  cpu: Cpu,
  database: Database,
  server: Server,
  network: Network,
};

const ServiceNode = ({ id, data, selected }: NodeProps) => {
  const IconComponent = ICON_LOOKUP[data.iconKey] || Server;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => setIsMenuOpen(false), []);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  }, []);

  return (
    <div
      onContextMenu={handleContextMenu}
      className={`
        w-64 bg-nss-surface rounded-lg shadow-xl transition-all duration-200
        overflow-visible /* Crucial for menu popup */
        ${selected
          ? 'ring-2 ring-nss-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]'
          : 'border border-nss-border hover:border-nss-muted/30'}
      `}
    >
      <NodeHandle type="target" position={Position.Top} />

      <NodeHeader
        label={data.label || 'Service'}
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
          <MetricItem label="Throughput" value={data.throughput} unit="req/s" />
          <MetricItem label="Error Rate" value={data.errorRate} unit="%" textColor="text-nss-danger" />
          <MetricItem label="Queue Depth" value={data.queueDepth} unit="ms" textColor="text-nss-warning" />
        </div>
        <ProgressBar label="CPU Load" value={data.load} />
      </div>

      <NodeHandle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(ServiceNode);