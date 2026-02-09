import { CatalogCategory } from '@renderer/types/ui';
import { NODE_REGISTRY } from '@renderer/config/nodeRegistry';
import { getTheme } from '@renderer/config/themeConfig';

const fromRegistry = (id: string) => {
  const def = NODE_REGISTRY[id];
  if (!def) return null; // Handle error gracefully
  const theme = getTheme(def.lookupKey);

  return {
    id: def.id,
    type: def.type,
    label: def.label,
    subLabel: def.subLabel,
    icon: def.icon,
    color: theme.bg,
    data: def.defaultData
  };
};

export const CATALOG_CONFIG: CatalogCategory[] = [
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    items: [
      fromRegistry('vpc-region')!
    ]
  },
  {
    id: 'compute',
    title: 'Compute Abstractions',
    items: [
      fromRegistry('backend-server')!,
      fromRegistry('lambda-function')!,
      fromRegistry('async-worker')!,
      fromRegistry('cron-job')!
    ]
  },
  {
    id: 'datastore',
    title: 'Data Store',
    items: [
      fromRegistry('primary-db')!,
      fromRegistry('redis-cache')!
    ]
  },
  {
    id: 'network',
    title: 'Network',
    items: [
      fromRegistry('load-balancer')!
    ]
  },
];