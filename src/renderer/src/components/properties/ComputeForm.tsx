import type { AnyNodeData } from '@renderer/types/ui'

interface ComputeFormProps {
  data: AnyNodeData
  onUpdate: (path: string, value: unknown) => void
}

export const ComputeForm = (_props: ComputeFormProps) => {
  void _props
  return null
}
