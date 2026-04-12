import { AnyNodeData, AnyNodeDataKey, AnyNodeDataValue } from '@renderer/types/ui'
import { ComputeForm } from './ComputeForm'
import { ServiceForm } from './ServiceForm'
import { SecurityForm } from './SecurityForm'

interface PropertiesFormProps {
  data: AnyNodeData
  onUpdate: <K extends AnyNodeDataKey>(key: K, value: AnyNodeDataValue<K>) => void
}

export const PropertiesForm = ({ data, onUpdate }: PropertiesFormProps) => {
  const labelEditor =
    'label' in data ? (
      <div className="space-y-2 mb-6 border-b border-nss-border pb-6">
        <label className="text-[10px] font-bold text-nss-muted uppercase tracking-wider">
          Node Label
        </label>
        <input
          type="text"
          value={typeof data.label === 'string' ? data.label : ''}
          onChange={(e) => onUpdate('label', e.target.value as AnyNodeDataValue<'label'>)}
          placeholder="Enter node label"
          className="w-full bg-nss-bg border border-nss-border rounded px-2 py-1.5 text-xs text-nss-text focus:border-nss-primary outline-none transition-colors"
        />
      </div>
    ) : null

  switch (data.kind) {
    case 'compute':
      return (
        <div className="space-y-6">
          {labelEditor}
          <ComputeForm data={data} onUpdate={onUpdate} />
        </div>
      )
    case 'service':
      return (
        <div className="space-y-6">
          {labelEditor}
          <ServiceForm data={data} onUpdate={onUpdate} />
        </div>
      )
    case 'security':
      return (
        <div className="space-y-6">
          {labelEditor}
          <SecurityForm data={data} onUpdate={onUpdate} />
        </div>
      )
    default:
      // VPC nodes have no editable simulation properties
      return null
  }
}
