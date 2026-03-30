export const THEME_CONFIG: Record<string, { bg: string; border: string; text: string }> = {
  // Compute
  SERVER: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-indigo-600' },
  LAMBDA: { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-yellow-600' },
  WORKER: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-600' },
  CRON: { bg: 'bg-gray-500', border: 'border-gray-600', text: 'text-gray-600' },
  auth: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-red-600' },
  'search-service': { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-violet-600' },

  // Infrastructure
  cloud: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-600' },
  az: { bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-orange-500' },
  subnet: { bg: 'bg-sky-500', border: 'border-sky-600', text: 'text-sky-600' },

  // Service Nodes (existing)
  database: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-600' },
  server: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-600' }, // Redis/Cache
  network: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-indigo-600' },
  globe: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-purple-600' }, // API Gateway
  routing: { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-violet-600' },

  // Clients & Edge
  monitor: { bg: 'bg-sky-500', border: 'border-sky-600', text: 'text-sky-600' }, // Client/User
  dns: { bg: 'bg-slate-400', border: 'border-slate-500', text: 'text-slate-500' }, // DNS
  cdn: { bg: 'bg-teal-500', border: 'border-teal-600', text: 'text-teal-600' }, // CDN

  // Messaging
  queue: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-600' }, // Message Queue
  broker: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-red-600' }, // Event Broker

  // Data Stores (new)
  nosql: { bg: 'bg-lime-500', border: 'border-lime-600', text: 'text-lime-600' }, // NoSQL DB
  replica: { bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-cyan-600' }, // Read Replica
  storage: { bg: 'bg-stone-500', border: 'border-stone-600', text: 'text-stone-600' }, // Object Storage
  search: { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-violet-600' }, // Search Index

  // App Support
  notification: { bg: 'bg-fuchsia-500', border: 'border-fuchsia-600', text: 'text-fuchsia-600' }, // Push Notification
  analytics: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-600' }, // Streaming Analytics

  // External
  external: { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-rose-600' }, // External Service

  waf: {
    bg: 'bg-rose-500',
    border: 'border-rose-600',
    text: 'text-rose-600'
  },
  firewall: {
    bg: 'bg-orange-500',
    border: 'border-orange-500',
    text: 'text-orange-600'
  },
  ingress: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-500',
    text: 'text-indigo-600'
  },
  proxy: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-500',
    text: 'text-indigo-600'
  },

  nat: {
    bg: 'bg-teal-500',
    border: 'border-teal-600',
    text: 'text-teal-600'
  },
  vpn: {
    bg: 'bg-slate-500',
    border: 'border-slate-500',
    text: 'text-slate-600'
  },

  // Fallbacks
  default: { bg: 'bg-slate-500', border: 'border-slate-600', text: 'text-slate-600' }
}

export const getTheme = (key: string) => {
  return THEME_CONFIG[key] || THEME_CONFIG.default
}
