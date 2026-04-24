import type { AnyNodeData } from '@renderer/types/ui'
import {
  FIELD_DEFINITIONS,
  PROFILE_FIELD_GROUPS,
  type FieldPath
} from '@renderer/config/fieldConfig'
import { FormField } from './FormField'

interface PropertiesFormProps {
  data: AnyNodeData
  onUpdate: (path: FieldPath, value: unknown) => void
}

function getVisibleFieldPaths(data: AnyNodeData, paths: FieldPath[]): FieldPath[] {
  return paths.filter((path) => {
    const config = FIELD_DEFINITIONS[path]
    if (!config) return false
    return config.visible ? config.visible(data) : true
  })
}

function getPathValue(target: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) return undefined
    if (Array.isArray(current)) {
      const index = Number(segment)
      return Number.isInteger(index) ? current[index] : undefined
    }
    if (typeof current === 'object') {
      return (current as Record<string, unknown>)[segment]
    }
    return undefined
  }, target)
}

export const PropertiesForm = ({ data, onUpdate }: PropertiesFormProps) => {
  const groups = PROFILE_FIELD_GROUPS[data.profile]

  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-nss-border pb-6">
        <label className="text-[10px] font-bold text-nss-muted uppercase tracking-wider">
          Node Label
        </label>
        <input
          type="text"
          value={data.label}
          onChange={(event) => onUpdate('label', event.target.value)}
          placeholder="Enter node label"
          className="w-full bg-nss-bg border border-nss-border rounded px-2 py-1.5 text-xs text-nss-text focus:border-nss-primary outline-none transition-colors"
        />
      </div>

      {data.profile === 'composite' ? (
        <div className="rounded-md border border-nss-border bg-nss-surface p-3 text-xs text-nss-muted">
          Composite nodes are canvas containers only. They are not serialized into the simulation
          engine.
        </div>
      ) : (
        Object.entries(groups).map(([groupLabel, paths]) => {
          const visiblePaths = getVisibleFieldPaths(data, paths)
          if (visiblePaths.length === 0) return null

          return (
            <section key={groupLabel} className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-nss-muted">
                {groupLabel}
              </h3>
              <div className="rounded-lg border border-nss-border bg-nss-surface px-4 py-3">
                {visiblePaths.map((path) => {
                  const config = FIELD_DEFINITIONS[path]
                  if (!config) return null

                  return (
                    <FormField
                      key={path}
                      fieldPath={path}
                      config={config}
                      value={getPathValue(data, path)}
                      onChange={(value) => onUpdate(path, value)}
                    />
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
