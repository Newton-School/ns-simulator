import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ComponentCatalog } from './ComponentCatalog';
import { PropertyInspector } from './PropertyInspector';
import { TelemetryDeck } from './TelemetryDeck';
import { Canvas } from './Canvas';
import { CommandBar } from './CommandBar';

// --- Shared Components ---

type ResizeHandleProps = {
    className?: string;
    vertical?: boolean;
    id?: string; // Added ID for accessibility labeling
};

const ResizeHandle = ({ className = "", vertical = false, id }: ResizeHandleProps) => (
    <PanelResizeHandle
        id={id}
        /* 1. Keyboard Navigation: tabIndex=0 makes it focusable */
        tabIndex={0}
        
        /* 2. Accessibility Roles */
        role="separator"
        aria-orientation={vertical ? "vertical" : "horizontal"}
        aria-label="Resize Panel" 
        
        className={`
            bg-gray-700 
            hover:bg-blue-500 
            transition-colors 
            group 
            flex 
            justify-center 
            items-center
            
            /* 3. Visual Focus Indicator (Critical for keyboard users) */
            outline-none
            focus-visible:bg-blue-500
            focus-visible:ring-2
            focus-visible:ring-blue-300
            focus-visible:ring-opacity-50
            
            ${vertical ? "w-1 flex-col h-full cursor-col-resize" : "h-1 w-full flex-row cursor-row-resize"} 
            ${className}
        `}
    >
        <div
            className={`
                bg-gray-500 
                group-hover:bg-white 
                rounded
                /* 4. Ensure inner bar lights up when handle has focus */
                group-focus-visible:bg-white
                ${vertical ? "h-4 w-0.5" : "w-8 h-0.5"}
            `}
        />
    </PanelResizeHandle>
);

// --- Main Layout ---

export const MainLayout = () => {
    // State for panel visibility
    const [isLeftOpen, setIsLeftOpen] = useState(true);
    const [isRightOpen, setIsRightOpen] = useState(true);
    const [isBottomOpen, setIsBottomOpen] = useState(true);

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-900 text-gray-200">

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
            <div className="flex-1 overflow-hidden relative">
                <PanelGroup direction="horizontal" autoSaveId="main-layout-horizontal">

                    {/* Pane B: Left Sidebar */}
                    {isLeftOpen && (
                        <>
                            <Panel defaultSize={20} minSize={10} maxSize={30} order={1} id="left-panel">
                                <ComponentCatalog />
                            </Panel>
                            {/* Added ID for specificity */}
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
                                    {/* Added ID for specificity */}
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
                            {/* Added ID for specificity */}
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