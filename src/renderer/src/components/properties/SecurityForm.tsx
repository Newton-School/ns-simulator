import { SecurityNodeData } from '@renderer/types/ui'
import { FIELD_DEFINITIONS, FIELD_GROUPS_BY_KIND } from '@renderer/config/fieldConfig'
import { FormField } from './FormField'

interface SecurityFormProps {
  data: SecurityNodeData
  onUpdate: (key: string, value: any) => void
}

export const SecurityForm = ({ data, onUpdate }: SecurityFormProps) => {
  const renderField = (key: string) => {
    const config = FIELD_DEFINITIONS[key]
    const value = (data as any)[key]
    if (!config || value === undefined) return null
    return (
      <FormField
        key={key}
        fieldKey={key}
        config={config}
        value={value}
        onChange={(val) => onUpdate(key, val)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(FIELD_GROUPS_BY_KIND.security).map(([groupName, fields]) => {
        const hasVisible = fields.some(
          (k) => (data as any)[k] !== undefined && FIELD_DEFINITIONS[k]
        )
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
