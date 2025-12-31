import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Server } from 'lucide-react'; 

const ServiceNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`
      w-64 bg-[#1F242C] rounded-lg shadow-xl overflow-hidden transition-all duration-200
      ${selected ? 'ring-2 ring-blue-500 box-shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border border-[#2A303C]'}
    `}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />

      {/* Header */}
      <div className="bg-[#15191E] p-3 border-b border-[#2A303C] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-blue-400" />
          <span className="font-bold text-sm text-slate-200">{data.label || 'Service'}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${data.status === 'critical' ? 'bg-red-500' : 'bg-emerald-500'}`} />
      </div>

      {/* Body / Metrics */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Throughput</div>
          <div className="text-slate-200 font-mono text-lg">{data.throughput || '0'} <span className="text-xs text-slate-500">req/s</span></div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Error Rate</div>
          <div className={`${data.errorRate > 1 ? 'text-red-400' : 'text-emerald-400'} font-mono text-lg`}>
            {data.errorRate || '0.00'}%
          </div>
        </div>
        
        {/* Load Bar */}
        <div className="col-span-2 mt-2">
           <div className="flex justify-between text-[10px] text-slate-500 mb-1">
             <span>Load</span>
             <span>{data.load || 0}%</span>
           </div>
           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
             <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${data.load || 0}%` }} 
             />
           </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
};

export default memo(ServiceNode);