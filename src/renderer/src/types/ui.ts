// Define the shape of a library item
export interface CatalogItem {
  id: string;
  type: 'serviceNode' | 'gatewayNode' | 'databaseNode'; // Maps to React Flow nodeTypes
  label: string;
  subLabel: string;
  icon: any; // Lucide Icon Component
  color: string; // Tailwind class for the icon background
  data: {
    iconKey: string;
    status: 'healthy' | 'degraded' | 'critical';
    throughput?: number;
    errorRate?: number;
    load?: number;
    queueDepth?: number;
  };
}

export interface CatalogCategory {
  id: string;
  title: string;
  items: CatalogItem[];
}