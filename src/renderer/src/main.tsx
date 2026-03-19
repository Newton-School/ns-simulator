import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WorkspaceLayout } from './components/templates/WorkspaceLayout'
import useStore from './store/useStore'

if (window.nssimulator && window.nssimulator.onCloseRequest) {
  window.nssimulator.onCloseRequest(() => {
    // Access the current value in the store from Zustand directly
    const isUnsaved = useStore.getState().isUnsaved
    return isUnsaved
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkspaceLayout />
  </StrictMode>
)
