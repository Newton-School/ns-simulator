import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WorkspaceLayout } from './components/layout/WorkspaceLayout'
import useStore from './store/useStore'

let closeRequestUnsubscribe: (() => void) | undefined
if (window.nssimulator && window.nssimulator.onCloseRequest) {
  closeRequestUnsubscribe = window.nssimulator.onCloseRequest(() => {
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
