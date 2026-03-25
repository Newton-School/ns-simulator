import { FIELD_DEFINITIONS, FIELD_GROUPS } from '@renderer/config/fieldConfig'
import { FormField } from '../molecules/FormField'
import { Cpu, Zap, Layers, AlertTriangle } from 'lucide-react'
import { COMPUTE_DEFAULTS } from '@renderer/config/nodeRegistry'

interface PropertiesFormProps {
  data: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export const PropertiesForm = ({ data, onUpdate }: PropertiesFormProps) => {
  const renderField = (key: string) => {
    const config = FIELD_DEFINITIONS[key]
    if (!config || data[key] === undefined) return null

    return (
      <FormField
        key={key}
        fieldKey={key}
        config={config}
        value={data[key]}
        onChange={(val) => onUpdate(key, val)}
      />
    )
  }

  const groupedKeys = new Set(Object.values(FIELD_GROUPS).flat())
  const isComputeNode = !!data.computeType

  const handleTypeChange = (newType: string) => {
    onUpdate('computeType', newType)

    const defaults = COMPUTE_DEFAULTS[newType]
    if (defaults) {
      onUpdate('label', defaults.label)
      onUpdate('subLabel', defaults.subLabel)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 mb-6 border-b border-nss-border pb-6">
        <label className="text-[10px] font-bold text-nss-muted uppercase tracking-wider">
          Node Label
        </label>
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onUpdate('label', e.target.value)}
          placeholder="Enter node label"
          className="w-full bg-nss-bg border border-nss-border rounded px-2 py-1.5 text-xs text-nss-text focus:border-nss-primary outline-none transition-colors"
        />
      </div>

      {isComputeNode && (
        <div className="space-y-5 mb-6 border-b border-nss-border pb-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-nss-muted uppercase flex items-center gap-1.5">
              <Cpu size={12} /> Execution Model
            </label>
            <select
              value={data.computeType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full bg-nss-bg border border-nss-border rounded px-2 py-1.5 text-xs text-nss-text focus:border-nss-primary outline-none"
            >
              <option value="SERVER">Server (Long Running)</option>
              <option value="LAMBDA">Lambda (Ephemeral)</option>
              <option value="WORKER">Worker (Async)</option>
              <option value="CRON">Cron (Scheduled)</option>
            </select>
          </div>

          {/* Utilization Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-nss-muted uppercase flex items-center gap-1.5">
                <Zap size={12} /> Utilization
              </label>
              <span className="text-[10px] font-mono text-nss-primary bg-nss-primary/10 px-1.5 py-0.5 rounded">
                {data.cpu_usage}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={data.cpu_usage}
              onChange={(e) => onUpdate('cpu_usage', parseInt(e.target.value))}
              className="w-full accent-nss-primary h-1.5 bg-nss-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Queue Depth Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-nss-muted uppercase flex items-center gap-1.5">
              <Layers size={12} /> Queue Depth
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={data.queue_depth}
                onChange={(e) => onUpdate('queue_depth', parseInt(e.target.value))}
                className="w-full bg-nss-bg border border-nss-border rounded pl-2 pr-8 py-1.5 text-xs text-nss-text focus:border-nss-primary outline-none"
              />
              <span className="absolute right-3 top-2 text-[10px] text-nss-muted font-bold pointer-events-none">
                REQ
              </span>
            </div>
          </div>

          {/* Overload Toggle */}
          <label
            className={`
                        flex items-center justify-between p-3 rounded border cursor-pointer transition-all
                        ${
                          data.is_overloaded
                            ? 'bg-nss-danger/5 border-nss-danger/30'
                            : 'bg-nss-bg border-nss-border hover:border-nss-muted'
                        }
                    `}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={14}
                className={data.is_overloaded ? 'text-nss-danger' : 'text-nss-muted'}
              />
              <div className="flex flex-col">
                <span
                  className={`text-xs font-bold ${data.is_overloaded ? 'text-nss-danger' : 'text-nss-text'}`}
                >
                  Simulate Overload
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={data.is_overloaded || false}
              onChange={(e) => onUpdate('is_overloaded', e.target.checked)}
              className="w-3.5 h-3.5 accent-nss-danger"
            />
          </label>
        </div>
      )}

      {/* GENERIC FIELDS LOOP */}
      {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => {
        const hasVisibleFields = fields.some((k) => data[k] !== undefined && FIELD_DEFINITIONS[k])
        if (!hasVisibleFields) return null

        return (
          <div key={groupName} className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-nss-muted uppercase tracking-wider">
                {groupName}
              </span>
              <div className="h-px flex-1 bg-nss-border"></div>
            </div>
            {fields.map((key) => renderField(key))}
          </div>
        )
      })}

      {/* UNGROUPED FIELDS */}
      <div className="pt-2">
        {Object.keys(data).map((key) => {
          if (['id', 'label', 'subLabel', 'iconKey', 'position', 'type'].includes(key)) return null
          if (['computeType', 'cpu_usage', 'queue_depth', 'is_overloaded'].includes(key))
            return null
          if (groupedKeys.has(key)) return null

          return renderField(key)
        })}
      </div>
    </div>
  )
}
