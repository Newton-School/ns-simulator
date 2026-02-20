/**
 * All possible event types that drive the simulation state.
 */
export type EventType =
    | 'REQUEST_GENERATED' | 'REQUEST_ARRIVAL' | 'PROCESSING_START' | 'PROCESSING_COMPLETE'
    | 'REQUEST_FORWARDED' | 'REQUEST_COMPLETE' | 'REQUEST_TIMEOUT' | 'REQUEST_REJECTED'
    | 'NODE_FAILURE' | 'NODE_RECOVERY' | 'NETWORK_PARTITION' | 'LATENCY_SPIKE'
    | 'SCALE_UP' | 'SCALE_DOWN' | 'CIRCUIT_BREAKER_OPEN' | 'CIRCUIT_BREAKER_CLOSE'
    | 'HEALTH_CHECK' | 'CACHE_HIT' | 'CACHE_MISS' | 'DB_FAILOVER';

/**
 * Priorities for tie-breaking when two events share the same timestamp.
 * Lower number = higher priority. (Run time)
 */
export const EventPriority = {
    SYSTEM: 0,      // health checks, config changes, node failures
    ARRIVAL: 1,     // request arrivals
    PROCESSING: 2,  // processing start/complete
    DEPARTURE: 3,   // request forwarding
    TIMEOUT: 4,     // timeouts (process last — give the request a chance to complete)
} as const;

export interface SimulationEvent {
    timestamp: bigint;              // microseconds
    type: EventType;
    nodeId: string;
    requestId: string;
    data: Record<string, unknown>;  // event-specific payload
    priority: number;               // derived from EventPriority
}

export interface RequestSpan {
    nodeId: string;
    arrivalTime: bigint;
    queueWait: bigint;
    serviceTime: bigint;
    departureTime: bigint;
}

export interface Request {
    id: string;
    type: string;                   // e.g., "GET", "POST", "DB_QUERY"
    sizeBytes: number;
    priority: number;               // 0 = high, 1 = normal, 2 = low
    createdAt: bigint;              // timestamp when generated
    deadline: bigint;               // absolute timeout timestamp
    path: string[];                 // nodeIds visited so far
    spans: RequestSpan[];           // tracing data per node
    retryCount: number;
    metadata: Record<string, unknown>;
}

/**
 * Internal helper to resolve the default priority based on EventType. (Run time)
 */
function getDefaultPriority(type: EventType): number {
    switch (type) {
        case 'REQUEST_GENERATED':
        case 'REQUEST_ARRIVAL':
            return EventPriority.ARRIVAL;

        case 'PROCESSING_START':
        case 'PROCESSING_COMPLETE':
        case 'REQUEST_COMPLETE':
        case 'REQUEST_REJECTED':
        case 'CACHE_HIT':
        case 'CACHE_MISS':
            return EventPriority.PROCESSING;

        case 'REQUEST_FORWARDED':
            return EventPriority.DEPARTURE;

        case 'REQUEST_TIMEOUT':
            return EventPriority.TIMEOUT;

        case 'NODE_FAILURE':
        case 'NODE_RECOVERY':
        case 'NETWORK_PARTITION':
        case 'LATENCY_SPIKE':
        case 'SCALE_UP':
        case 'SCALE_DOWN':
        case 'CIRCUIT_BREAKER_OPEN':
        case 'CIRCUIT_BREAKER_CLOSE':
        case 'HEALTH_CHECK':
        case 'DB_FAILOVER':
            return EventPriority.SYSTEM;

        default:
            return EventPriority.SYSTEM;
    }
}

/**
 * Factory function to generate standard simulation events.
 * Auto-assigns the correct tie-breaking priority if not explicitly provided. (Run time)
 */
export function createEvent(
    type: EventType,
    nodeId: string,
    requestId: string,
    data: Record<string, unknown>,
    timestamp: bigint,
    priority?: number
): SimulationEvent {
    return {
        timestamp,
        type,
        nodeId,
        requestId,
        data,
        priority: priority ?? getDefaultPriority(type),
    };
}