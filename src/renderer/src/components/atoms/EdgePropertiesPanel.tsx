import React from 'react'

export interface EdgePropertiesPanelProps {
  labelValue: string
  onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClose: () => void
}

export const EdgePropertiesPanel = ({
  labelValue,
  onLabelChange,
  onClose
}: EdgePropertiesPanelProps) => {
  return (
    <div className="absolute top-4 right-4 z-10 w-64 p-4 rounded shadow-xl border border-nss-border bg-nss-panel transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
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
      
      <div className="flex flex-col gap-1">
        <label className="text-xs text-nss-muted font-medium">Protocol Label</label>
        <input
          type="text"
          value={labelValue}
          onChange={onLabelChange}
          placeholder="e.g. http, grpc, tcp"
          className="w-full px-3 py-2 text-sm rounded border bg-nss-input-bg border-nss-border-high text-nss-text placeholder-nss-placeholder focus:outline-none focus:border-nss-info focus:ring-1 focus:ring-nss-info transition-all"
        />
      </div>
    </div>
  )
}