import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  saveScenario: (data: string) => {
    // Validate that data is a non-empty string and not excessively long
    if (typeof data !== 'string') {
      console.error('saveScenario: data must be a string');
      return;
    }
    if (data.length === 0) {
      console.error('saveScenario: data must not be empty');
      return;
    }
    if (data.length > 1000000) {
      console.error('saveScenario: data is too large');
      return;
    }
    ipcRenderer.send('nssimulator:save-scenario', data);
  },

  loadScenario: () => ipcRenderer.invoke('nssimulator:load-scenario').catch((error) => {
    console.error('Error in loadScenario:', error);
    throw error;
  }),

  runSimulation: (config: any) => ipcRenderer.send('nssimulator:run-simulation', config)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('nssimulator', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
