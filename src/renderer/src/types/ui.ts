
// Define the shape of a library item
export interface CatalogItem {
  id: string;
  type: 'serviceNode' | 'gatewayNode' | 'databaseNode' | 'vpcNode'; // Maps to React Flow nodeTypes
  label: string;
  subLabel: string;
  icon: any; // Lucide Icon Component
  color: string; // Tailwind class for the icon background
  data: {
    iconKey: string;
    status?: 'healthy' | 'degraded' | 'critical';
    throughput?: number;
    errorRate?: number;
    load?: number;
    queueDepth?: number;

    // Visual Animation Props
    // Controls particle color: 'http'(blue), 'success'(green), 'error'(red), 'warning'(orange)
    trafficType?: 'http' | 'success' | 'error' | 'warning' | 'default';

    // Controls visual density: 1 (light) to ~12 (heavy flood)
    packets?: number;

    // Controls animation speed: 'slow'(4s), 'normal'(2s), 'fast'(1s)
    speed?: 'slow' | 'normal' | 'fast';
  };
}

export interface CatalogCategory {
  id: string;
  title: string;
  items: CatalogItem[];
}