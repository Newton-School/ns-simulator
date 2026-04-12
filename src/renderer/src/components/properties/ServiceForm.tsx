import { AnyNodeDataKey, AnyNodeDataValue, ServiceNodeData } from '@renderer/types/ui'
import {
  FIELD_DEFINITIONS,
  FIELD_GROUPS_BY_KIND,
  type FieldKey
} from '@renderer/config/fieldConfig'
import { FormField } from './FormField'

interface ServiceFormProps {
  data: ServiceNodeData
  onUpdate: <K extends AnyNodeDataKey>(key: K, value: AnyNodeDataValue<K>) => void
}

export const ServiceForm = ({ data, onUpdate }: ServiceFormProps) => {
  const renderField = (key: FieldKey) => {
    const config = FIELD_DEFINITIONS[key]
    const value = data[key as keyof ServiceNodeData]
    if (!config) return null
    return (
      <FormField
        key={key}
        fieldKey={key}
        config={config}
        value={value}
        onChange={(val) => onUpdate(key, val as AnyNodeDataValue<typeof key>)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(FIELD_GROUPS_BY_KIND.service).map(([groupName, fields]) => {
        const hasVisible = fields.some((k) => Boolean(FIELD_DEFINITIONS[k]))
        if (!hasVisible) return null
        return (
          <div key={groupName} className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-nss-muted uppercase tracking-wider">
                {groupName}
              </span>
              <div className="h-px flex-1 bg-nss-border" />
            </div>
            {fields.map(renderField)}
          </div>
        )
      })}
    </div>
  )
}
