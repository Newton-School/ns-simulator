// --- Types ---

type HeaderProps = {
    toggleLeft: () => void;
    isLeftOpen: boolean;
    toggleRight: () => void;
    isRightOpen: boolean;
    toggleBottom: () => void;
    isBottomOpen: boolean;
};

type ToggleButtonProps = {
    onClick: () => void;
    isOpen: boolean;
    icon: React.ReactNode;
    label: string;
};

// --- Sub-Components ---

const ToggleButton = ({ onClick, isOpen, icon, label }: ToggleButtonProps) => {
    const baseClass = "p-2 rounded transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800";
    const activeClass = "bg-gray-700 text-white shadow-inner";
    const inactiveClass = "text-gray-400 hover:bg-gray-700 hover:text-white";

    return (
        <button
            type="button"
            onClick={onClick}
            // Accessibility: Label the action and describe the state
            aria-label={label}
            aria-expanded={isOpen}
            className={`${baseClass} ${isOpen ? activeClass : inactiveClass}`}
        >
            {/* Hide icon from screen readers to prevent duplicate/noisy announcements */}
            <span aria-hidden="true" className="flex items-center justify-center">
                {icon}
            </span>
        </button>
    );
};

// --- Main Component ---

export const CommandBar = ({
    toggleLeft, isLeftOpen,
    toggleRight, isRightOpen,
    toggleBottom, isBottomOpen
}: HeaderProps) => {
    return (
        <header className="h-12 bg-gray-800 text-white flex items-center justify-between px-4 shrink-0 border-b border-gray-700 select-none">

            {/* LEFT SECTION */}
            <div className="flex items-center gap-3">
                <ToggleButton
                    onClick={toggleLeft}
                    isOpen={isLeftOpen}
                    label="Toggle left sidebar"
                    icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <line x1="9" x2="9" y1="3" y2="21" />
                        </svg>
                    }
                />
            </div>

            {/* CENTER SECTION */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-700 hover:bg-green-600 active:bg-green-800 text-white rounded text-xs font-bold transition-colors uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:ring-offset-gray-800"
                    aria-label="Run simulation"
                    onClick={() => { /* click handler here */ }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Run
                </button>

                <div className="w-px h-4 bg-gray-600 mx-1" role="presentation" />

                <ToggleButton
                    onClick={toggleBottom}
                    isOpen={isBottomOpen}
                    label="Toggle bottom panel"
                    icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <line x1="3" x2="21" y1="15" y2="15" />
                        </svg>
                    }
                />
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-3">
                <ToggleButton
                    onClick={toggleRight}
                    isOpen={isRightOpen}
                    label="Toggle right sidebar"
                    icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <line x1="15" x2="15" y1="3" y2="21" />
                        </svg>
                    }
                />
            </div>
        </header>
    );
};