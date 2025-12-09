import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI;
    nssimulator: NsSimulatorApi;
    api: unknown;
  }
}

export interface NsSimulatorApi {
  saveScenario: (data: string) => void;
  loadScenario: () => Promise<any>;
  runSimulation: (config: any) => void;
}