import { Handle, HandleProps } from 'reactflow'

export const NodeHandle = (props: HandleProps) => (
  <Handle {...props} className="!bg-nss-primary !w-3 !h-3 !border-2 !border-nss-surface" />
)
