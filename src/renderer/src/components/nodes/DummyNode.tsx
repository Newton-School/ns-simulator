import { Handle, Position, NodeProps } from 'reactflow';
import { CatalogItem } from '../../config/catalogConfig';

export default function DummyNode({ data }: NodeProps<CatalogItem>) {
  return (
    <div className="min-w-[120px] bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-gray-400"
      />

      {/* Colored Header Strip */}
      <div className={`h-1 w-full ${data.color || 'bg-gray-500'}`} />

      {/* Content Body */}
      <div className="p-2 flex flex-col items-center justify-center">
        <span className="text-gray-700 text-xs text-center">
          {data.label || 'Unknown Node'}
        </span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-gray-400"
      />
    </div>
  );
}