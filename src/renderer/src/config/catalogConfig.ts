import { CatalogCategory } from '@renderer/types/ui'
import { NODE_REGISTRY } from '@renderer/config/nodeRegistry'
import { getTheme } from '@renderer/config/themeConfig'

const fromRegistry = (id: string) => {
  const def = NODE_REGISTRY[id]
  if (!def) return null // Handle error gracefully
  const theme = getTheme(def.lookupKey)

  return {
    id: def.id,
    type: def.type,
    label: def.label,
    subLabel: def.subLabel,
    icon: def.icon,
    color: theme.bg,
    data: def.defaultData
  }
}

export const CATALOG_CONFIG: CatalogCategory[] = [
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    items: [
      fromRegistry('vpc-region')!,
      fromRegistry('availability-zone')!,
      fromRegistry('subnet')!
    ]
  },
  {
    id: 'clients-edge',
    title: 'Clients & Edge',
    items: [fromRegistry('client-user')!, fromRegistry('dns')!, fromRegistry('cdn')!]
  },
  {
    id: 'network',
    title: 'Network',
    items: [
      fromRegistry('api-gateway')!,
      fromRegistry('load-balancer')!,
      fromRegistry('ingress-controller')!,
      fromRegistry('reverse-proxy')!,
      fromRegistry('nat-gateway')!,
      fromRegistry('vpn-gateway')!
    ]
  },
  {
    id: 'security',
    title: 'Security',
    items: [fromRegistry('waf')!, fromRegistry('firewall-rule')!]
  },
  {
    id: 'compute',
    title: 'Compute Abstractions',
    items: [
      fromRegistry('backend-server')!,
      fromRegistry('lambda-function')!,
      fromRegistry('async-worker')!,
      fromRegistry('cron-job')!,
      fromRegistry('auth-service')!,
      fromRegistry('search-service')!
    ]
  },
  {
    id: 'messaging',
    title: 'Messaging',
    items: [fromRegistry('message-queue')!, fromRegistry('message-broker')!]
  },
  {
    id: 'datastore',
    title: 'Data Store',
    items: [
      fromRegistry('primary-db')!,
      fromRegistry('read-replica')!,
      fromRegistry('redis-cache')!,
      fromRegistry('nosql-db')!,
      fromRegistry('object-storage')!,
      fromRegistry('search-index')!
    ]
  },
  {
    id: 'external',
    title: 'External',
    items: [fromRegistry('external-service')!]
  }
]
