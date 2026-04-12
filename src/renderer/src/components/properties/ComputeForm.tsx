import { Cpu, Zap, Layers, AlertTriangle } from 'lucide-react'
import { ComputeNodeData, ComputeType } from '@renderer/types/ui'
import { COMPUTE_DEFAULTS } from '@renderer/config/nodeRegistry'
import { FIELD_DEFINITIONS, FIELD_GROUPS_BY_KIND } from '@renderer/config/fieldConfig'
import { FormField } from './FormField'

interface ComputeFormProps {
  data: ComputeNodeData
  onUpdate: (key: string, value: any) => void
}

export const ComputeForm = ({ data, onUpdate }: ComputeFormProps) => {
  const handleTypeChange = (newType: ComputeType) => {
    onUpdate('computeType', newType)
    const defaults = COMPUTE_DEFAULTS[newType]
    if (defaults) {
      onUpdate('label', defaults.label)
      onUpdate('subLabel', defaults.subLabel)
    }
  }

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
      {/* Execution model */}
      <div className="space-y-5 mb-6 border-b border-nss-border pb-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-nss-muted uppercase flex items-center gap-1.5">
            <Cpu size={12} /> Execution Model
          </label>
          <select
            value={data.computeType}
            onChange={(e) => handleTypeChange(e.target.value as ComputeType)}
            className="w-full bg-nss-bg border border-nss-border rounded px-2 py-1.5 text-xs text-nss-text focus:border-nss-primary outline-none"
          >
            {Object.entries(COMPUTE_DEFAULTS).map(([type, { label, subLabel }]) => (
              <option key={type} value={type}>
                {label} ({subLabel})
              </option>
            ))}
          </select>
        </div>

        {/* Utilization slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-nss-muted uppercase flex items-center gap-1.5">
              <Zap size={12} /> Utilization
            </label>
            <span className="text-[10px] font-mono text-nss-primary bg-nss-primary/10 px-1.5 py-0.5 rounded">
              {data.utilization}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={data.utilization}
            onChange={(e) => onUpdate('utilization', parseInt(e.target.value))}
            className="w-full accent-nss-primary h-1.5 bg-nss-border rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Queue depth */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-nss-muted uppercase flex items-center gap-1.5">
            <Layers size={12} /> Queue Depth
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={data.queueDepth}
              onChange={(e) => onUpdate('queueDepth', parseInt(e.target.value))}
              className="w-full bg-nss-bg border border-nss-border rounded pl-2 pr-8 py-1.5 text-xs text-nss-text focus:border-nss-primary outline-none"
            />
            <span className="absolute right-3 top-2 text-[10px] text-nss-muted font-bold pointer-events-none">
              REQ
            </span>
          </div>
        </div>

        {/* Overload toggle */}
        <label
          className={`
            flex items-center justify-between p-3 rounded border cursor-pointer transition-all
            ${
              data.isOverloaded
                ? 'bg-nss-danger/5 border-nss-danger/30'
                : 'bg-nss-bg border-nss-border hover:border-nss-muted'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={14}
              className={data.isOverloaded ? 'text-nss-danger' : 'text-nss-muted'}
            />
            <span
              className={`text-xs font-bold ${data.isOverloaded ? 'text-nss-danger' : 'text-nss-text'}`}
            >
              Simulate Overload
            </span>
          </div>
          <input
            type="checkbox"
            checked={data.isOverloaded || false}
            onChange={(e) => onUpdate('isOverloaded', e.target.checked)}
            className="w-3.5 h-3.5 accent-nss-danger"
          />
        </label>
      </div>

      {/* Generic grouped fields */}
      {Object.entries(FIELD_GROUPS_BY_KIND.compute).map(([groupName, fields]) => {
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
