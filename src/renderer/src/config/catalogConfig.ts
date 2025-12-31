import { 
  Globe, 
  Cpu, 
  Database, 
  Server, 
  Network, 
} from 'lucide-react';

// Define the shape of a library item
export interface CatalogItem {
  id: string;
  type: 'serviceNode' | 'gatewayNode' | 'databaseNode'; // Maps to React Flow nodeTypes
  label: string;
  subLabel: string;
  icon: any; // Lucide Icon Component
  color: string; // Tailwind class for the icon background
  data: {
    // Default data when dropped on canvas
    status: 'healthy' | 'degraded' | 'critical';
    throughput?: number;
    errorRate?: number;
    load?: number;
  };
}

export interface CatalogCategory {
  id: string;
  title: string;
  items: CatalogItem[];
}

export const CATALOG_CONFIG: CatalogCategory[] = [
  {
    id: 'compute',
    title: 'Compute',
    items: [
      {
        id: 'api-gateway',
        type: 'serviceNode', // Using generic serviceNode for now, could be specific
        label: 'API Gateway',
        subLabel: 'Ingress Controller',
        icon: Globe,
        color: 'bg-purple-500',
        data: { status: 'healthy', throughput: 1200, errorRate: 0.01, load: 45 }
      },
      {
        id: 'worker-pool',
        type: 'serviceNode',
        label: 'Worker Pool',
        subLabel: 'Async processing',
        icon: Cpu,
        color: 'bg-blue-500',
        data: { status: 'healthy', throughput: 800, errorRate: 0.00, load: 20 }
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
        data: { status: 'healthy', throughput: 2400, errorRate: 0.00, load: 60 }
      },
      {
        id: 'redis-cache',
        type: 'serviceNode',
        label: 'Redis Cache',
        subLabel: 'In-memory key/val',
        icon: Server,
        color: 'bg-orange-500',
        data: { status: 'healthy', throughput: 5000, errorRate: 0.00, load: 15 }
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
        data: { status: 'healthy', throughput: 10000, errorRate: 0.00, load: 10 }
      }
    ]
  }
];