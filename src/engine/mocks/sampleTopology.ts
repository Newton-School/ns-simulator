import { TopologyJSON } from '../types';

export const mockArchitecture: TopologyJSON = {
  id: "arch-123",
  name: "Mock E-Commerce",
  version: "1.0.0",
  global: {
    simulationDuration: 60000,
    seed: "test-seed",
    warmupDuration: 5000,
    timeResolution: "microsecond",
    defaultTimeout: 30000
  },
  nodes: [
    {
      id: "node-gw",
      type: "api-gateway",
      category: "network-and-edge",
      label: "Main Gateway",
      position: { x: 100, y: 100 },
      queue: { workers: 50, capacity: 1000, discipline: "fifo" }
    },
    {
      id: "node-api",
      type: "microservice",
      category: "compute",
      label: "Order Service",
      position: { x: 300, y: 100 },
      processing: {
        distribution: { type: "log-normal", mu: 1.5, sigma: 0.2 },
        timeout: 2000
      }
    },
    {
      id: "node-db",
      type: "relational-db",
      category: "storage-and-data",
      label: "Orders DB",
      position: { x: 500, y: 100 }
    }
  ],
  edges: [
    {
      id: "edge-1",
      source: "node-gw",
      target: "node-api",
      mode: "synchronous",
      protocol: "grpc",
      latency: { distribution: { type: "constant", value: 5 }, pathType: "same-dc" },
      bandwidth: 1000,
      maxConcurrentRequests: 5000,
      packetLossRate: 0,
      errorRate: 0
    }
  ],
  workload: {
    sourceNodeId: "node-gw",
    pattern: "constant",
    baseRps: 500,
    requestDistribution: [{ type: "POST", weight: 1.0, sizeBytes: 1024 }]
  }
};