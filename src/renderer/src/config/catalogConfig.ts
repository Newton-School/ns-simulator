import {
  Globe,
  Cpu,
  Database,
  Server,
  Network,
} from 'lucide-react';
import { CatalogCategory } from '@renderer/types/ui';

export const CATALOG_CONFIG: CatalogCategory[] = [
  {
    id: 'compute',
    title: 'Compute',
    items: [
      {
        id: 'api-gateway',
        type: 'serviceNode',
        label: 'API Gateway',
        subLabel: 'Ingress Controller',
        icon: Globe,
        color: 'bg-purple-500',
        data: {
          iconKey: 'globe',
          status: 'critical',
          throughput: 1200,
          errorRate: 2,
          load: 45,
          queueDepth: 12
        }
      },
      {
        id: 'worker-pool',
        type: 'serviceNode',
        label: 'Worker Pool',
        subLabel: 'Async processing',
        icon: Cpu,
        color: 'bg-blue-500',
        data: {
          iconKey: 'cpu',
          status: 'healthy',
          throughput: 800,
          load: 20
        }
      }
    ]
  },
  {
    id: 'datastore',
    title: 'Data Store',
    items: [
      {
        id: 'primary-db',
        type: 'serviceNode',
        label: 'Primary DB',
        subLabel: 'Relational SQL',
        icon: Database,
        color: 'bg-emerald-500',
        data: {
          iconKey: 'database',
          status: 'healthy',
          throughput: 2400,
          errorRate: 0.00,
          load: 60
        }
      },
      {
        id: 'redis-cache',
        type: 'serviceNode',
        label: 'Redis Cache',
        subLabel: 'In-memory key/val',
        icon: Server,
        color: 'bg-orange-500',
        data: {
          iconKey: 'server',
          status: 'healthy',
          throughput: 5000,
          errorRate: 0.00,
          load: 15
        }
      }
    ]
  },
  {
    id: 'network',
    title: 'Network',
    items: [
      {
        id: 'load-balancer',
        type: 'serviceNode',
        label: 'Load Balancer',
        subLabel: 'L7 Routing',
        icon: Network,
        color: 'bg-indigo-500',
        data: {
          iconKey: 'network',
          status: 'healthy',
          throughput: 10000,
          errorRate: 0.00,
          load: 10
        }
      }
    ]
  }
];