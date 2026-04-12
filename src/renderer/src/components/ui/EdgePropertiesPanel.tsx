import { EdgeSimulationData } from '@renderer/types/ui'

export interface EdgePropertiesPanelValue extends EdgeSimulationData {
  label?: string
}

export interface EdgePropertiesPanelProps {
  value: EdgePropertiesPanelValue
  onChange: (patch: Partial<EdgePropertiesPanelValue>) => void
  onClose: () => void
}

const CONTROL_CLASS =
  'w-full px-2 py-1 text-xs rounded border bg-nss-input-bg border-nss-border text-nss-text placeholder-nss-placeholder focus:outline-none focus:border-nss-info focus:ring-1 focus:ring-nss-info transition-all'

export const EdgePropertiesPanel = ({ value, onChange, onClose }: EdgePropertiesPanelProps) => {
  return (
    <div className="absolute top-4 right-4 z-10 w-72 p-4 rounded shadow-xl border border-nss-border bg-nss-panel transition-colors duration-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-nss-text uppercase tracking-wider">
          Edge Properties
        </h3>
        <button
          onClick={onClose}
          className="text-nss-muted hover:text-nss-text transition-colors"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[11px] text-nss-muted font-medium">Label</label>
          <input
            type="text"
            value={value.label ?? ''}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. HTTP, gRPC"
            className={CONTROL_CLASS}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-nss-muted font-medium">Protocol</label>
            <select
              value={value.protocol ?? 'https'}
              onChange={(e) =>
                onChange({ protocol: e.target.value as EdgeSimulationData['protocol'] })
              }
              className={CONTROL_CLASS}
            >
              {['https', 'grpc', 'tcp', 'udp', 'websocket', 'amqp', 'kafka'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-nss-muted font-medium">Path Type</label>
            <select
              value={value.pathType ?? 'same-dc'}
              onChange={(e) =>
                onChange({ pathType: e.target.value as EdgeSimulationData['pathType'] })
              }
              className={CONTROL_CLASS}
            >
              {['same-rack', 'same-dc', 'cross-zone', 'cross-region', 'internet'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-nss-muted font-medium">Latency Mu</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={value.latencyMu ?? 2.3}
              onChange={(e) => onChange({ latencyMu: Number(e.target.value) })}
              className={CONTROL_CLASS}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-nss-muted font-medium">Latency Sigma</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={value.latencySigma ?? 0.5}
              onChange={(e) => onChange({ latencySigma: Number(e.target.value) })}
              className={CONTROL_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-nss-muted font-medium">Bandwidth (Mbps)</label>
            <input
              type="number"
              min={1}
              step={1}
              value={value.bandwidth ?? 1000}
              onChange={(e) => onChange({ bandwidth: Number(e.target.value) })}
              className={CONTROL_CLASS}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-nss-muted font-medium">Max Concurrent</label>
            <input
              type="number"
              min={1}
              step={1}
              value={value.maxConcurrentRequests ?? 100}
              onChange={(e) => onChange({ maxConcurrentRequests: Number(e.target.value) })}
              className={CONTROL_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-nss-muted font-medium">Packet Loss (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={value.packetLossRate ?? 0}
              onChange={(e) => onChange({ packetLossRate: Number(e.target.value) })}
              className={CONTROL_CLASS}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-nss-muted font-medium">Edge Error (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={value.errorRate ?? 0.1}
              onChange={(e) => onChange({ errorRate: Number(e.target.value) })}
              className={CONTROL_CLASS}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
