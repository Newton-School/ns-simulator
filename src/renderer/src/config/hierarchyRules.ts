export type AllowedParents = string[] | 'root'

export interface HierarchyRule {
  allowedParents: AllowedParents
  errorMessage: string
}

export const HIERARCHY_RULES: Record<string, HierarchyRule> = {
  'vpc-region': {
    allowedParents: 'root',
    errorMessage: 'VPCs cannot be nested inside another VPC. Use VPC Peering, Transit Gateway, or another connectivity component to connect multiple VPCs.'
  },
  'availability-zone': {
    allowedParents: ['vpc-region'],
    errorMessage: 'Availability Zones must be placed inside a VPC Region.'
  },
  'subnet': {
    allowedParents: ['availability-zone', 'vpc-region'],
    errorMessage: 'Subnets must be placed inside an Availability Zone or VPC Region.'
  },
  'nat-gateway': {
    allowedParents: ['vpc-region', 'subnet', 'root'],
    errorMessage: 'Gateways must be placed within a VPC Region or Subnet.'
  },
  'routing-rule': {
    allowedParents: ['vpc-region', 'subnet', 'root'],
    errorMessage: 'Routing rules must be placed within a VPC Region or Subnet.'
  },
  'routing-policy': {
    allowedParents: ['vpc-region', 'subnet', 'root'],
    errorMessage: 'Routing policies must be placed within a VPC Region or Subnet.'
  },
  'vpn-gateway': {
    allowedParents: ['vpc-region', 'subnet', 'root'],
    errorMessage: 'Gateways must be placed within a VPC Region or Subnet.'
  },
  'api-gateway': {
    allowedParents: ['vpc-region', 'subnet', 'root'],
    errorMessage: 'Gateways must be placed within a VPC Region or Subnet.'
  },
  'security-group': {
    allowedParents: ['vpc-region', 'subnet', 'root'],
    errorMessage: 'Security Groups must be placed within a VPC Region or Subnet.'
  },
  '*': {
    allowedParents: ['subnet', 'root'],
    errorMessage: 'Resources must be placed within a Subnet or on the root canvas.'
  }
}

export function validatePlacement(childTemplateId: string, parentTemplateId: string | null): { valid: boolean; error?: string } {
  const rule = HIERARCHY_RULES[childTemplateId] || HIERARCHY_RULES['*']
  const targetParent = parentTemplateId || 'root'

  if (rule.allowedParents === 'root' && targetParent !== 'root') {
    return { valid: false, error: rule.errorMessage }
  }

  if (Array.isArray(rule.allowedParents)) {
    if (!rule.allowedParents.includes(targetParent)) {
      return { valid: false, error: rule.errorMessage }
    }
  }

  return { valid: true }
}
