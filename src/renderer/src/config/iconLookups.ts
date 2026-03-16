/**
 * Icon lookup maps for each node type.
 * Extracted here so that:
 *  1. Node component files only export React components (react-refresh compat).
 *  2. Consistency tests can import these maps without pulling in React deps.
 */
import {
  Server,
  Globe,
  Cpu,
  Database,
  Network,
  LucideIcon,
  Monitor,
  Navigation,
  Wifi,
  Inbox,
  Radio,
  Layers,
  GitBranch,
  HardDrive,
  Search,
  ExternalLink,
  Cloud,
  Box,
  LayoutGrid,
  Shield,
  ShieldAlert,
  Lock,
  Router,
  LockKeyhole,
  Waypoints,
  ArrowRightLeft
} from 'lucide-react'

/** Used by ServiceNode */
export const SERVICE_ICON_LOOKUP: Record<string, LucideIcon> = {
  globe: Globe,
  cpu: Cpu,
  database: Database,
  server: Server,
  network: Network,
  nat: Router,
  vpn: LockKeyhole,
  ingress: Waypoints,
  proxy: ArrowRightLeft,
  monitor: Monitor,
  dns: Navigation,
  cdn: Wifi,
  queue: Inbox,
  broker: Radio,
  nosql: Layers,
  replica: GitBranch,
  storage: HardDrive,
  search: Search,
  external: ExternalLink
}

/** Used by VpcNode */
export const VPC_ICON_LOOKUP: Record<string, LucideIcon> = {
  cloud: Cloud,
  az: Box,
  subnet: LayoutGrid
}

/** Used by SecurityNode */
export const SECURITY_ICON_LOOKUP: Record<string, LucideIcon> = {
  waf: Shield,
  firewall: ShieldAlert,
  default: Lock
}
