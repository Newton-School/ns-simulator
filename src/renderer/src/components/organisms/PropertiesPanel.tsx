import { useState } from 'react';
import useStore from '../../store/useStore';
import { FIELD_DEFINITIONS, FIELD_GROUPS } from '@renderer/config/fieldConfig';
import { Label, Input, Select, Slider, StatusBadge } from '../atoms/FormElements';
import { clsx } from 'clsx';
import {
  Globe, Cpu, Database, Server, Network,
  Settings, Info
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  globe: Globe, cpu: Cpu, database: Database,
  server: Server, network: Network, default: Settings
};

const COLOR_MAP: Record<string, string> = {
  globe: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  cpu: 'text-nss-primary bg-nss-primary/10 border-nss-primary/20',
  database: 'text-nss-success bg-nss-success/10 border-nss-success/20',
  server: 'text-nss-warning bg-nss-warning/10 border-nss-warning/20',
  network: 'text-nss-info bg-nss-info/10 border-nss-info/20',
};

export const PropertiesPanel = () => {
  const nodes = useStore((state) => state.nodes);
  const updateNodeData = useStore((state) => state.updateNodeData);

  const selectedNode = nodes.find((n) => n.selected);
  const [activeTab, setActiveTab] = useState('specs');

  const handleUpdate = (key: string, value: any) => {
    if (!selectedNode) return;
    updateNodeData(selectedNode.id, { [key]: value });
  };

  if (!selectedNode) {
    return (
      <div className="h-full bg-nss-panel border-l border-nss-border flex flex-col items-center justify-center text-nss-muted gap-2">
        <Settings size={24} className="opacity-20" />
        <p className="text-xs font-medium uppercase tracking-wide">No Selection</p>
      </div>
    );
  }

  const { data } = selectedNode;
  const Icon = ICON_MAP[data.iconKey] || ICON_MAP.default;
  const colorClass = COLOR_MAP[data.iconKey] || 'text-nss-muted bg-nss-surface border-nss-border';

  const renderField = (key: string) => {
    const config = FIELD_DEFINITIONS[key];
    const value = data[key];

    if (!config || value === undefined) return null;

    switch (config.type) {
      case 'slider':
        return (
          <div key={key} className="mb-5">
            <Label>{config.label}</Label>
            <Slider
              value={value}
              min={config.min}
              max={config.max}
              unit={config.unit}
              onChange={(val) => handleUpdate(key, val)}
            />
          </div>
        );
      case 'select':
        return (
          <div key={key} className="mb-5">
            <Label>{config.label}</Label>
            <Select value={value} onChange={(e) => handleUpdate(key, e.target.value)}>
              {config.options.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </div>
        );
      case 'input':
      default:
        return (
          <div key={key} className="mb-5">
            <Label>{config.label}</Label>
            <Input
              type={typeof value === 'number' ? 'number' : 'text'}
              step={config.step}
              value={value}
              onChange={(e) => handleUpdate(key, typeof value === 'number' ? parseFloat(e.target.value) : e.target.value)}
              rightElement={config.unit}
            />
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full bg-nss-panel border-l border-nss-border flex flex-col text-nss-text font-sans shadow-xl">

      {/* --- HEADER --- */}
      <div className="p-5 border-b border-nss-border bg-nss-panel">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center border transition-colors", colorClass)}>
              <Icon size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-nss-text leading-tight mb-1">{data.label || 'Node'}</h2>
              <div className="flex items-center gap-2">
                {data.subLabel && <span className="text-[10px] text-nss-muted font-mono uppercase">{data.subLabel}</span>}
                {data.status && <StatusBadge status={data.status} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex border-b border-nss-border px-2 bg-nss-surface">
        {['specs', 'state', 'logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
              activeTab === tab
                ? "border-nss-primary text-nss-text"
                : "border-transparent text-nss-muted hover:text-nss-text hover:bg-nss-panel/50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-nss-panel">
        {activeTab === 'specs' ? (
          <div className="space-y-1">

            {/* Loop through predefined groups to maintain order */}
            {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => {
              // Only render group if at least one field exists in data
              const hasFields = fields.some(key => data[key] !== undefined);
              if (!hasFields) return null;

              return (
                <div key={groupName} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-nss-muted uppercase">{groupName}</span>
                    <div className="h-px flex-1 bg-nss-border"></div>
                  </div>
                  {fields.map(key => renderField(key))}
                </div>
              );
            })}

            {/* Fallback for fields in data but not in a group */}
            <div className="pt-2">
              {Object.keys(data).map(key => {
                // Ignore internal keys or keys already grouped
                if (['id', 'label', 'subLabel', 'iconKey', 'position', 'type'].includes(key)) return null;
                if (Object.values(FIELD_GROUPS).flat().includes(key)) return null;
                return renderField(key);
              })}
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-nss-muted text-xs text-center">
            <Info size={24} className="mb-2 opacity-50" />
            <span>{activeTab} view not configured</span>
          </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="p-4 border-t border-nss-border bg-nss-surface">
        <div className="flex justify-between items-center text-[10px] text-nss-muted font-mono">
          <span>UUID: {selectedNode.id.split('-')[0]}...</span>
          <span>v1.2.0</span>
        </div>
      </div>
    </div>
  );
};