import { useState, useCallback } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { useFileHandlers } from '../../hooks/useFileHandlers';

// Sub-components
import { ComponentCatalog } from './ComponentCatalog';
import { PropertyInspector } from './PropertyInspector';
import { TelemetryDeck } from './TelemetryDeck';
import { Canvas } from './Canvas';
import { CommandBar } from './CommandBar';
import { ResizeHandle } from './ResizeHandle';

export const MainLayout = () => {
    const [isLeftOpen, setIsLeftOpen] = useState(true);
    const [isRightOpen, setIsRightOpen] = useState(true);
    const [isBottomOpen, setIsBottomOpen] = useState(true);

    const handleGetFileData = useCallback(() => {
        return JSON.stringify({ nodes: [], edges: [] });
    }, []);

    const handleLoadFileData = useCallback((data: any) => {
        console.log("File content returned to UI:", data);
    }, []);

    useFileHandlers(handleGetFileData, handleLoadFileData);

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-gray-900">

            {/* Pane A: Header (Fixed) */}
            <CommandBar
                toggleLeft={() => setIsLeftOpen(prev => !prev)}
                toggleRight={() => setIsRightOpen(prev => !prev)}
                toggleBottom={() => setIsBottomOpen(prev => !prev)}
                isLeftOpen={isLeftOpen}
                isRightOpen={isRightOpen}
                isBottomOpen={isBottomOpen}
            />

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative h-full">
                <PanelGroup direction="horizontal" autoSaveId="main-layout-horizontal">

                    {/* Pane B: Left Sidebar */}
                    {isLeftOpen && (
                        <>
                            <Panel defaultSize={20} minSize={10} maxSize={30} order={1} id="left-panel">
                                <ComponentCatalog />
                            </Panel>
                            <ResizeHandle vertical id="resize-left-catalog" />
                        </>
                    )}

                    {/* Center Column (Workspace + Bottom Panel) */}
                    <Panel order={2} minSize={30} id="center-panel">
                        <PanelGroup direction="vertical" autoSaveId="main-layout-vertical">

                            {/* Pane E: Center Workspace */}
                            <Panel defaultSize={isBottomOpen ? 70 : 100} minSize={20} order={1}>
                                <Canvas />
                            </Panel>

                            {/* Pane D: Bottom Panel */}
                            {isBottomOpen && (
                                <>
                                    <ResizeHandle id="resize-bottom-telemetry" />
                                    <Panel defaultSize={30} minSize={10} order={2}>
                                        <TelemetryDeck />
                                    </Panel>
                                </>
                            )}

                        </PanelGroup>
                    </Panel>

                    {/* Pane C: Right Sidebar */}
                    {isRightOpen && (
                        <>
                            <ResizeHandle vertical id="resize-right-inspector" />
                            <Panel defaultSize={25} minSize={15} maxSize={40} order={3} id="right-panel">
                                <PropertyInspector />
                            </Panel>
                        </>
                    )}

                </PanelGroup>
            </div>
        </div>
    );
};