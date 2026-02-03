import {
  Cpu,
  Database,
  Server,
  Network,
  Cloud,
  Zap,
  Clock,
} from 'lucide-react';
import { CatalogCategory } from '@renderer/types/ui';

export const CATALOG_CONFIG: CatalogCategory[] = [
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    items: [
      {
        id: 'vpc-region',
        type: 'vpcNode',
        label: 'VPC Region',
        subLabel: 'Isolated Network',
        icon: Cloud,
        color: 'bg-blue-500',
        data: {
          iconKey: 'cloud',
        }
      }
    ]
  },
  {
    id: 'compute',
    title: 'Compute Abstractions',
    items: [
      {
        id: 'backend-server',
        type: 'computeNode',   // New Node Type
        label: 'App Server',
        subLabel: 'Long-running Process',
        icon: Server,
        color: 'bg-indigo-500',
        data: {
          computeType: 'SERVER',
          cpu_usage: 45,
          queue_depth: 12,
          is_overloaded: false
        }
      },
      {
        id: 'lambda-function',
        type: 'computeNode',
        label: 'Serverless Fn',
        subLabel: 'Event Driven',
        icon: Zap,
        color: 'bg-yellow-500',
        data: {
          computeType: 'LAMBDA',
          cpu_usage: 10,
          queue_depth: 0,
          is_overloaded: false
        }
      },
      {
        id: 'async-worker',
        type: 'computeNode',
        label: 'Job Worker',
        subLabel: 'Background Task',
        icon: Cpu,
        color: 'bg-emerald-500',
        data: {
          computeType: 'WORKER',
          cpu_usage: 88,
          queue_depth: 145,
          is_overloaded: true
        }
      },
       {
        id: 'cron-job',
        type: 'computeNode',
        label: 'Cron Job',
        subLabel: 'Scheduled Task',
        icon: Clock,
        color: 'bg-gray-500',
        data: {
          computeType: 'CRON',
          cpu_usage: 0,
          queue_depth: 0,
          is_overloaded: false
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
          queueDepth: 10,
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
  },
];