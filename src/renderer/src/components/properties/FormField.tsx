import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Slider } from '../ui/Slider'
import type { FieldDefinition, FieldKey } from '@renderer/config/fieldConfig'

interface FormFieldProps {
  fieldKey: FieldKey
  config: FieldDefinition
  value: unknown
  onChange: (value: unknown) => void
}

export const FormField = ({ config, value, onChange }: FormFieldProps) => {
  const normalizedValue = (() => {
    if (value !== undefined) return value

    switch (config.type) {
      case 'slider':
        return config.min
      case 'select':
        return config.options[0] ?? ''
      case 'boolean':
        return false
      case 'input':
      default:
        return 0
    }
  })()

  const renderInput = () => {
    switch (config.type) {
      case 'slider':
        return (
          <Slider
            value={Number(normalizedValue)}
            min={config.min}
            max={config.max}
            unit={config.unit}
            onChange={onChange}
          />
        )

      case 'select':
        return (
          <Select value={String(normalizedValue)} onChange={(e) => onChange(e.target.value)}>
            {config.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        )

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(normalizedValue)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-3.5 h-3.5 accent-nss-primary"
          />
        )

      case 'input':
      default:
        return (
          <Input
            type={typeof normalizedValue === 'number' ? 'number' : 'text'}
            step={config.step}
            value={normalizedValue as string | number}
            rightElement={config.unit}
            onChange={(e) => {
              const val = e.target.value
              if (typeof normalizedValue === 'number') {
                const parsed = Number(val)
                onChange(Number.isNaN(parsed) ? 0 : parsed)
                return
              }
              onChange(val)
            }}
          />
        )
    }
  }

  if (config.type === 'boolean') {
    return <div className="mb-5">{renderInput()}</div>
  }

  return (
    <div className="mb-5">
      <Label>{config.label}</Label>
      {renderInput()}
    </div>
  )
}
