import { useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'

// Store
import useStore from '@renderer/store/useStore'

// Hooks
import { useFlowPersistence } from '@renderer/hooks/useFlowPersistence'

// Organisms
import { LibrarySidebar } from '../library/LibrarySidebar'
import { PropertiesPanel } from '../properties/PropertiesPanel'
import { FlowCanvas } from '../canvas/FlowCanvas'
import { Header } from './Header'

// Atoms
import { ResizeHandle } from '../ui/ResizeHandle'

export const WorkspaceLayout = () => {
  // Sidebar State
  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isRightOpen, setIsRightOpen] = useState(true)

  const { handleSave, handleOpen } = useFlowPersistence()

  const fileName = useStore((s) => s.fileName)
  const isUnsaved = useStore((s) => s.isUnsaved)

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-gray-900">
      {/* Pane A: Header (Fixed) */}
      <Header
        // Layout Toggles
        toggleLeft={() => setIsLeftOpen((prev) => !prev)}
        toggleRight={() => setIsRightOpen((prev) => !prev)}
        isLeftOpen={isLeftOpen}
        isRightOpen={isRightOpen}
        // File Actions
        onSave={handleSave}
        onOpen={handleOpen}
        // File Status
        fileName={fileName}
        isUnsaved={isUnsaved}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative h-full">
        <PanelGroup direction="horizontal" autoSaveId="main-layout-horizontal">
          {/* Pane B: Left Sidebar */}
          {isLeftOpen && (
            <>
              <Panel defaultSize={20} minSize={10} maxSize={30} order={1} id="left-panel">
                <LibrarySidebar />
              </Panel>
              <ResizeHandle vertical id="resize-left-catalog" />
            </>
          )}

          {/* Center Column Workspace */}
          <Panel order={2} minSize={30} id="center-panel">
            <PanelGroup direction="vertical" autoSaveId="main-layout-vertical">
              {/* Pane E: Center Workspace */}
              <Panel defaultSize={100} minSize={20} order={1}>
                <FlowCanvas />
              </Panel>
            </PanelGroup>
          </Panel>

          {/* Pane C: Right Sidebar */}
          {isRightOpen && (
            <>
              <ResizeHandle vertical id="resize-right-inspector" />
              <Panel defaultSize={25} minSize={15} maxSize={40} order={3} id="right-panel">
                <PropertiesPanel />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  )
}
