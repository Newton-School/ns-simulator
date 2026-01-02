import { Play, Sidebar, PanelBottom } from 'lucide-react';
import { ToggleButton } from '../atoms/ToggleButton';
import { ThemeToggle } from '../features/ThemeToggle';

interface HeaderProps {
    toggleLeft: () => void;
    isLeftOpen: boolean;
    toggleRight: () => void;
    isRightOpen: boolean;
    toggleBottom: () => void;
    isBottomOpen: boolean;
}

export const Header = ({
    toggleLeft, isLeftOpen,
    toggleRight, isRightOpen,
    toggleBottom, isBottomOpen
}: HeaderProps) => {
    return (
        <header className="h-12 bg-nss-panel text-nss-text flex items-center justify-between px-4 shrink-0 border-b border-nss-border select-none transition-colors duration-200">

            {/* LEFT SECTION: Branding & Left Toggle */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 mr-2">
                    <div className="w-6 h-6 bg-nss-primary rounded flex items-center justify-center font-bold text-[10px] text-white">
                        NS
                    </div>
                    <span className="font-bold text-sm tracking-tight text-nss-text">
                        Simulator
                    </span>
                </div>

                <div className="h-4 w-px bg-nss-border mx-1" role="presentation" />

                <ToggleButton
                    onClick={toggleLeft}
                    isOpen={isLeftOpen}
                    label="Toggle left sidebar"
                    icon={<Sidebar size={18} />}
                />
            </div>

            {/* CENTER SECTION: Main Actions */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="
                        flex items-center gap-2 px-6 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all
                        bg-nss-primary hover:bg-nss-primaryHover text-white 
                        shadow-lg shadow-nss-bg/50
                        focus:outline-none focus:ring-2 focus:ring-nss-primary 
                        hover:scale-105 active:scale-95
                    "
                    onClick={() => console.log('Sim Started')}
                >
                    <Play size={12} fill="currentColor" />
                    Run Sim
                </button>

                <div className="w-px h-4 bg-nss-border mx-2" role="presentation" />

                <ToggleButton
                    onClick={toggleBottom}
                    isOpen={isBottomOpen}
                    label="Toggle bottom panel"
                    icon={<PanelBottom size={18} />}
                />
            </div>

            {/* RIGHT SECTION: Properties Toggle & Theme */}
            <div className="flex items-center gap-3">
                <ThemeToggle />

                {/* Visual Divider */}
                <div className="h-4 w-px bg-nss-border" role="presentation" />

                <ToggleButton
                    onClick={toggleRight}
                    isOpen={isRightOpen}
                    label="Toggle right sidebar"
                    icon={<Sidebar size={18} className="rotate-180" />}
                />
            </div>
        </header>
    );
};