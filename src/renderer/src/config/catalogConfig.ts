export interface CatalogItem {
    type: string; 
    label: string;     
    color: string;    
    description?: string;
  }
  
  export const CATALOG_ITEMS: CatalogItem[] = [
    { 
      type: 'server', 
      label: 'Server', 
      color: 'bg-blue-500', 
      description: 'Compute Node' 
    },
    { 
      type: 'database', 
      label: 'Database', 
      color: 'bg-green-500', 
      description: 'Storage Node' 
    },
    { 
      type: 'router', 
      label: 'Router', 
      color: 'bg-purple-500', 
      description: 'Network Gateway' 
    },
    { 
      type: 'loadBalancer', 
      label: 'Load Balancer', 
      color: 'bg-orange-500', 
      description: 'Traffic Distributor' 
    },
  ];