import React from 'react';

type HeaderProps = {
    toggleLeft: () => void;
    isLeftOpen: boolean;
    toggleRight: () => void;
    isRightOpen: boolean;
    toggleBottom: () => void;
    isBottomOpen: boolean;
};

const ToggleButton = ({
    onClick,
    isOpen,
    icon
}: {
    onClick: () => void;
    isOpen: boolean;
    icon: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        className={`
      p-2 rounded transition-colors duration-200 flex items-center justify-center
      ${isOpen
                ? "bg-gray-700 text-white shadow-inner" // Active State
                : "text-gray-400 hover:bg-gray-700 hover:text-white" // Inactive State
            }
    `}
    >
        {icon}
    </button>
);

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
                    icon={
                        /* Left Sidebar Icon */
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <line x1="9" x2="9" y1="3" y2="21" />
                        </svg>
                    }
                />
                <span className="font-semibold text-sm tracking-wide text-gray-200">
                    Pane A: Command Bar
                </span>
            </div>

            {/* CENTER SECTION */}
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-1.5 bg-green-700 hover:bg-green-600 active:bg-green-800 text-white rounded text-xs font-bold transition-colors uppercase tracking-wider">
                    {/* Play Icon */}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Run
                </button>

                <div className="w-px h-4 bg-gray-600 mx-1"></div> {/* Divider */}

                <ToggleButton
                    onClick={toggleBottom}
                    isOpen={isBottomOpen}
                    icon={
                        /* Bottom Panel Icon */
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
                    icon={
                        /* Right Sidebar Icon */
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