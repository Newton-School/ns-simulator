import { CatalogCategory } from '@renderer/types/ui'
import { NODE_REGISTRY } from '@renderer/config/nodeRegistry'
import { getTheme } from '@renderer/config/themeConfig'

const fromRegistry = (id: string) => {
  const def = NODE_REGISTRY[id]
  if (!def) {
    console.warn(`Node registry missing definition for node id: ${id}`)
    return null // Handle error gracefully
  }
  const theme = getTheme(def.lookupKey)

  return {
    id: def.id,
    type: def.type,
    label: def.label,
    subLabel: def.subLabel,
    icon: def.icon,
    color: theme,
    data: { ...def.defaultData, registryId: def.id }
  }
}

const getItems = (ids: string[]) => {
  return ids.map(fromRegistry).filter((item): item is NonNullable<typeof item> => item !== null)
}

export const CATALOG_CONFIG: CatalogCategory[] = [
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    items: getItems([
      'vpc-region',
      'availability-zone',
      'subnet',
      'dns-server',
      'discovery-service'
    ])
  },
  {
    id: 'clients-edge',
    title: 'Clients & Edge',
    items: getItems(['client-user', 'dns', 'cdn'])
  },
  {
    id: 'network',
    title: 'Network',
    items: getItems([
      'api-gateway',
      'load-balancer',
      'ingress-controller',
      'reverse-proxy',
      'nat-gateway',
      'vpn-gateway',
      'routing-rule',
      'routing-policy'
    ])
  },
  {
    id: 'security',
    title: 'Security',
    items: getItems(['waf', 'firewall-rule', 'security-group'])
  },
  {
    id: 'compute',
    title: 'Compute Abstractions',
    items: getItems([
      'backend-server',
      'lambda-function',
      'async-worker',
      'cron-job',
      'auth-service',
      'search-service'
    ])
  },
  {
    id: 'messaging',
    title: 'Messaging',
    items: getItems(['message-queue', 'message-broker'])
  },
  {
    id: 'datastore',
    title: 'Data Store',
    items: getItems([
      'primary-db',
      'read-replica',
      'redis-cache',
      'nosql-db',
      'object-storage',
      'search-index'
    ])
  },
  {
    id: 'app-support',
    title: 'App Support',
    items: getItems(['push-notification-service', 'streaming-analytics'])
  },
  {
    id: 'external',
    title: 'External',
    items: getItems(['external-service'])
  },
  {
    id: 'control-plane',
    title: 'Control Plane',
    items: getItems(['config-store', 'secrets-manager', 'feature-flag-service'])
  },
  {
    id: 'observability',
    title: 'Observability',
    items: getItems([
      'metrics-collector-agent',
      'log-collector-agent',
      'log-aggregation-service',
      'distributed-tracing-collector',
      'alerting-engine',
      'health-check-monitor'
    ])
  }
]
