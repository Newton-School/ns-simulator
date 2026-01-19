import { useMemo } from 'react';
import { EdgeTypes } from 'reactflow';
import ServiceNode from '../../nodes/ServiceNode';
import VpcNode from '../../nodes/VpcNode';
import { PacketEdge } from '@renderer/components/molecules/flow/edges/PacketEdge';

export const GRID_COLOR = '#2A303C';

export const nodeTypes = {
    serviceNode: ServiceNode,
    vpcNode: VpcNode,
};

export const useFlowConfig = () => {
    const edgeTypes = useMemo<EdgeTypes>(() => ({ packet: PacketEdge }), []);

    const defaultEdgeOptions = useMemo(() => ({
        type: 'packet',
        animated: false,
        data: { trafficType: 'default', speed: 'normal' },
    }), []);

    return { edgeTypes, defaultEdgeOptions };
};