import { useEffect, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'

// Store
import useStore from '@renderer/store/useStore'

// Hooks
import { useFlowPersistence } from '@renderer/hooks/useFlowPersistence'
import { useSimulation } from '@renderer/hooks/useSimulation'
import { useTopologySerializer } from '@renderer/hooks/useTopologySerializer'

// Organisms
import { LibrarySidebar } from '../library/LibrarySidebar'
import { PropertiesPanel } from '../properties/PropertiesPanel'
import { FlowCanvas } from '../canvas/FlowCanvas'
import { Header } from './Header'
import { ScenarioBar } from '../simulation/ScenarioBar'
import { ResultsTray } from '../simulation/ResultsTray'

// Atoms
import { ResizeHandle } from '../ui/ResizeHandle'
import type { ScenarioSettings } from '../simulation/ScenarioBar'

export const WorkspaceLayout = () => {
  // Sidebar State
  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isRightOpen, setIsRightOpen] = useState(true)
  const [showResults, setShowResults] = useState(false)

  const { handleSave, handleOpen } = useFlowPersistence()

  const fileName = useStore((s) => s.fileName)
  const isUnsaved = useStore((s) => s.isUnsaved)
  const setSimulationMetrics = useStore((s) => s.setSimulationMetrics)
  const clearSimulationMetrics = useStore((s) => s.clearSimulationMetrics)

  // Simulation
  const sim = useSimulation()
  const { serialize } = useTopologySerializer()

  useEffect(() => {
    if (!sim.results) return

    const metricsByNode = Object.fromEntries(
      Object.entries(sim.results.perNode).map(([nodeId, metrics]) => [
        nodeId,
        {
          throughput: metrics.throughput,
          queueDepth: metrics.avgQueueLength,
          utilization: metrics.utilization * 100,
          errorRate: metrics.errorRate * 100
        }
      ])
    )

    setSimulationMetrics(metricsByNode)
  }, [sim.results, setSimulationMetrics])

  useEffect(() => {
    if (sim.status === 'idle') {
      clearSimulationMetrics()
    }
  }, [sim.status, clearSimulationMetrics])

  function handleRun(settings: ScenarioSettings) {
    const { topology, errors } = serialize({
      global: settings.global,
      workload: settings.workload
    })

    if (!topology || errors.length > 0) {
      console.error('[ScenarioBar] Serialization errors:', errors)
      return
    }

    setShowResults(true)
    clearSimulationMetrics()
    sim.run(topology)
  }

  const isRunning = sim.status === 'running'
  const isPaused = sim.status === 'paused'

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-nss-bg text-nss-text">
      {/* Header */}
      <Header
        toggleLeft={() => setIsLeftOpen((prev) => !prev)}
        toggleRight={() => setIsRightOpen((prev) => !prev)}
        isLeftOpen={isLeftOpen}
        isRightOpen={isRightOpen}
        onSave={handleSave}
        onOpen={handleOpen}
        fileName={fileName}
        isUnsaved={isUnsaved}
        onSimulate={() => {
          const { topology, errors } = serialize()
          if (!topology || errors.length > 0) return
          setShowResults(true)
          clearSimulationMetrics()
          sim.run(topology)
        }}
      />

      {/* Scenario Bar */}
      <ScenarioBar
        onRun={handleRun}
        onPause={sim.pause}
        onResume={sim.resume}
        onStop={() => {
          sim.stop()
          clearSimulationMetrics()
          setShowResults(false)
        }}
        isRunning={isRunning}
        isPaused={isPaused}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative h-full">
        <PanelGroup direction="horizontal" autoSaveId="main-layout-horizontal">
          {/* Left Sidebar */}
          {isLeftOpen && (
            <>
              <Panel defaultSize={20} minSize={10} maxSize={30} order={1} id="left-panel">
                <LibrarySidebar />
              </Panel>
              <ResizeHandle vertical id="resize-left-catalog" />
            </>
          )}

          {/* Center Column */}
          <Panel order={2} minSize={30} id="center-panel">
            <PanelGroup direction="vertical" autoSaveId="main-layout-vertical">
              {/* Canvas */}
              <Panel defaultSize={showResults ? 65 : 100} minSize={20} order={1}>
                <FlowCanvas />
              </Panel>

              {/* Results Tray */}
              {showResults && sim.status !== 'idle' && (
                <>
                  <ResizeHandle id="resize-results" />
                  <Panel defaultSize={35} minSize={15} maxSize={60} order={2}>
                    <ResultsTray
                      status={sim.status}
                      progress={sim.progress}
                      eventsProcessed={sim.eventsProcessed}
                      results={sim.results}
                      error={sim.error}
                      onClose={() => {
                        setShowResults(false)
                        sim.reset()
                        clearSimulationMetrics()
                      }}
                    />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Right Sidebar */}
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
