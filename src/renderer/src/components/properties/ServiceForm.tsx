import type { AnyNodeData } from '@renderer/types/ui'

interface ServiceFormProps {
  data: AnyNodeData
  onUpdate: (path: string, value: unknown) => void
}

export const ServiceForm = (_props: ServiceFormProps) => {
  void _props
  return null
}
