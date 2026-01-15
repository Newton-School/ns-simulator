import { memo } from 'react';
import { Position, NodeProps } from 'reactflow';
import { Server, Globe, Cpu, Database, Network } from 'lucide-react';

// Import Atoms & Molecules
import { NodeHandle } from '../../atoms/NodeHandle';
import { ProgressBar } from '../../atoms/ProgressBar';
import { NodeHeader } from '../../molecules/NodeHeader';
import { MetricItem } from '../../molecules/MetricItem';

const ICON_LOOKUP: Record<string, any> = {
  globe: Globe,
  cpu: Cpu,
  database: Database,
  server: Server,
  network: Network,
};

const ServiceNode = ({ data, selected }: NodeProps) => {

  const IconComponent = ICON_LOOKUP[data.iconKey] || Server;

  return (
    <div className={`
      w-64 bg-nss-surface rounded-lg shadow-xl overflow-hidden transition-all duration-200
      ${selected
        ? 'ring-2 ring-nss-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]'
        : 'border border-nss-border hover:border-nss-muted/30'}
    `}>
      {/* 1. Input Connection */}
      <NodeHandle type="target" position={Position.Top} />

      {/* 2. Header Molecule */}
      <NodeHeader
        label={data.label || 'Service'}
        icon={IconComponent}
        status={data.status}
        color={data.color}
      />

      {/* 3. Body Content */}
      <div className="p-4">

        {/* Metric Grid - Molecules handle their own conditional rendering */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <MetricItem
            label="Throughput"
            value={data.throughput}
            unit="req/s"
          />

          <MetricItem
            label="Error Rate"
            value={data.errorRate}
            unit="%"
            textColor={data.errorRate > 1 ? "text-nss-danger" : "text-nss-success"}
          />

          <MetricItem
            label="Queue Depth"
            value={data.queueDepth}
            unit="ms"
            textColor="text-nss-warning"
          />
        </div>

        {/* 4. Load Bar Atom */}
        <ProgressBar
          label="CPU Load"
          value={data.load}
        />
      </div>

      {/* 5. Output Connection */}
      <NodeHandle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(ServiceNode);