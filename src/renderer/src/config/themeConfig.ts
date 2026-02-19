export const THEME_CONFIG: Record<string, { bg: string; border: string; text: string }> = {
  // Compute
  SERVER: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-indigo-600' },
  LAMBDA: { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-yellow-600' },
  WORKER: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-600' },
  CRON: { bg: 'bg-gray-500', border: 'border-gray-600', text: 'text-gray-600' },

  //Infrastructure
  cloud: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-600' },

  //Service Nodes
  database: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-600' },
  server: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-600' }, // Redis/Cache
  network: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-indigo-600' },
  globe: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-purple-600' }, // Gateway

  //Fallbacks
  default: { bg: 'bg-slate-500', border: 'border-slate-600', text: 'text-slate-600' }
}

export const getTheme = (key: string): { bg: string; border: string; text: string } => {
  return THEME_CONFIG[key] || THEME_CONFIG.default
}
