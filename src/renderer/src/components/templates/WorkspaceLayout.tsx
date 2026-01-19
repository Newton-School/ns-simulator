import { useState, useCallback } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { useFileHandlers } from '../../hooks/useFileHandlers';
import useStore from '../../store/useStore';

// Organisms
import { LibrarySidebar } from '../organisms/LibrarySidebar';
import { PropertiesPanel } from '../organisms/PropertiesPanel';
import { FlowCanvas } from '../organisms/FlowCanvas';
import { Header } from '../organisms/Header';

// Atoms
import { ResizeHandle } from '../atoms/ResizeHandle';

export const WorkspaceLayout = () => {

    const [isLeftOpen, setIsLeftOpen] = useState(true);
    const [isRightOpen, setIsRightOpen] = useState(true);

    const handleGetFileData = useCallback(() => {
        const { nodes, edges } = useStore.getState();

        return JSON.stringify({ nodes, edges }, null, 2);
    }, []);

    const handleLoadFileData = useCallback((data: any) => {
        console.log("File content returned to UI:", data);

        if (data && data.nodes && data.edges) {
            useStore.getState().setNodes(data.nodes);
        }
    }, []);

    useFileHandlers(handleGetFileData, handleLoadFileData);

    return (

        <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-gray-900">
            {/* Pane A: Header (Fixed) */}

            <Header
                toggleLeft={() => setIsLeftOpen(prev => !prev)}
                toggleRight={() => setIsRightOpen(prev => !prev)}
                isLeftOpen={isLeftOpen}
                isRightOpen={isRightOpen}

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

    );

};