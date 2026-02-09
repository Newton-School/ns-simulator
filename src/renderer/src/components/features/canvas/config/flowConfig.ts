import { useMemo } from 'react';
import ServiceNode from '../../nodes/ServiceNode';
import VpcNode from '../../nodes/VpcNode';
import ComputeNode from '../../nodes/ComputeNode'; // Import new node

export const GRID_COLOR = '#2A303C';

export const nodeTypes = {
    serviceNode: ServiceNode,
    vpcNode: VpcNode,
    computeNode: ComputeNode, // Register here
};

export const useFlowConfig = () => {
    const edgeTypes = useMemo(() => ({}), []);
    const defaultEdgeOptions = useMemo(() => ({
        type: 'smoothstep', 
        animated: true,
        style: { stroke: '#94A3B8', strokeWidth: 2 },
    }), []);

    return { edgeTypes, defaultEdgeOptions };
};