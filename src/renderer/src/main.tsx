import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WorkspaceLayout } from './components/templates/WorkspaceLayout'
import useStore from './store/useStore'

let closeRequestUnsubscribe: (() => void) | undefined
if (window.nssimulator && window.nssimulator.onCloseRequest) {
  closeRequestUnsubscribe = window.nssimulator.onCloseRequest(() => {
    // Access the current value in the store from Zustand directly
    const isUnsaved = useStore.getState().isUnsaved
    return isUnsaved
  })
}
if (import.meta?.hot) {
  import.meta.hot.dispose(() => {
    if (closeRequestUnsubscribe) {
      closeRequestUnsubscribe()
      closeRequestUnsubscribe = undefined
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkspaceLayout />
  </StrictMode>
)
