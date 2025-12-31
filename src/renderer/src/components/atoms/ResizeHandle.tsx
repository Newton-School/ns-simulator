import { PanelResizeHandle } from 'react-resizable-panels';

type ResizeHandleProps = {
    className?: string;
    vertical?: boolean;
    id?: string; // Added ID for accessibility labeling
};

export const ResizeHandle = ({ className = "", vertical = false, id }: ResizeHandleProps) => (
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