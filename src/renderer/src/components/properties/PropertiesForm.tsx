import { AnyNodeData, AnyNodeDataKey, AnyNodeDataValue } from '@renderer/types/ui'
import { ComputeForm } from './ComputeForm'
import { ServiceForm } from './ServiceForm'
import { SecurityForm } from './SecurityForm'

interface PropertiesFormProps {
  data: AnyNodeData
  onUpdate: <K extends AnyNodeDataKey>(key: K, value: AnyNodeDataValue<K>) => void
}

export const PropertiesForm = ({ data, onUpdate }: PropertiesFormProps) => {
  switch (data.kind) {
    case 'compute':
      return <ComputeForm data={data} onUpdate={onUpdate} />
    case 'service':
      return <ServiceForm data={data} onUpdate={onUpdate} />
    case 'security':
      return <SecurityForm data={data} onUpdate={onUpdate} />
    default:
      // VPC nodes have no editable simulation properties
      return null
  }
}
