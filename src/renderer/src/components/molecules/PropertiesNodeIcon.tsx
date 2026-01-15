import { clsx } from 'clsx';
import {
  Globe, Cpu, Database, Server, Network, Cloud, Settings,
} from 'lucide-react';

interface NodeIconProps {
  iconKey: string;
  size?: number;
}

const ICON_MAP: Record<string, any> = {
  globe: Globe, cpu: Cpu, database: Database,
  server: Server, network: Network, cloud: Cloud, default: Settings,
};

const COLOR_MAP: Record<string, string> = {
  globe: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  cpu: 'text-nss-primary bg-nss-primary/10 border-nss-primary/20',
  database: 'text-nss-success bg-nss-success/10 border-nss-success/20',
  server: 'text-nss-warning bg-nss-warning/10 border-nss-warning/20',
  network: 'text-nss-info bg-nss-info/10 border-nss-info/20',
  cloud: 'text-nss-primary bg-nss-primary/10 border-nss-primary/20',
};

export const PropertiesNodeIcon = ({ iconKey, size = 20 }: NodeIconProps) => {
  const Icon = ICON_MAP[iconKey] || ICON_MAP.default;
  const colorClass = COLOR_MAP[iconKey] || COLOR_MAP.default;

  return (
    <div className={clsx(
      "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors shrink-0",
      colorClass
    )}>
      <Icon size={size} />
    </div>
  );
};