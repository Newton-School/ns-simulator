// src/components/organisms/Header.tsx
import { memo } from 'react';
import { Sidebar, Save, FolderOpen } from 'lucide-react';

// Atoms & Molecules
import { Divider } from '../atoms/Divider';
import { IconButton } from '../atoms/IconButton';
import { CtaButton } from '../atoms/CtaButton';
import { ToggleButton } from '../atoms/ToggleButton'; 
import { Branding } from '../molecules/Branding';
import { FileStatus } from '../molecules/FileStatus';

import { ThemeToggle } from '../features/ThemeToggle';

interface HeaderProps {
    // Layout Actions
    toggleLeft: () => void;
    isLeftOpen: boolean;
    toggleRight: () => void;
    isRightOpen: boolean;
    
    // File Actions
    onSave: () => void;
    onOpen: () => void;
    
    // Data
    fileName: string | null;
    isUnsaved: boolean;
}

export const Header = memo(({
    toggleLeft, isLeftOpen,
    toggleRight, isRightOpen,
    onSave, onOpen,
    fileName, isUnsaved
}: HeaderProps) => {
    
    return (
        <header className="h-12 bg-nss-panel text-nss-text flex items-center justify-between px-4 shrink-0 border-b border-nss-border transition-colors duration-200">
            
            {/* --- LEFT: Branding & Navigation --- */}
            <div className="flex items-center gap-1">
                <Branding />
                <Divider />
                <ToggleButton 
                    onClick={toggleLeft} 
                    isOpen={isLeftOpen} 
                    label="Toggle left sidebar" 
                    icon={<Sidebar size={18} />} 
                />
            </div>

            {/* --- CENTER: Workspace Actions --- */}
            <div className="flex items-center gap-3">
                <FileStatus fileName={fileName} isUnsaved={isUnsaved} />
                
                <div className="flex items-center gap-1">
                    <IconButton onClick={onOpen} icon={<FolderOpen size={18} />} label="Open Scenario (Ctrl+O)" />
                    <IconButton onClick={onSave} icon={<Save size={18} />} label="Save Scenario (Ctrl+S)" />
                </div>

                <Divider />
                
                <CtaButton onClick={() => console.log('Sim Started')} />
            </div>

            {/* RIGHT SECTION: Properties Toggle & Theme */}
            <div className="flex items-center gap-3">
                <ThemeToggle />
                <Divider />
                <ToggleButton 
                    onClick={toggleRight} 
                    isOpen={isRightOpen} 
                    label="Toggle right sidebar" 
                    icon={<Sidebar size={18} className="rotate-180" />} 
                />
            </div>
        </header>
    );
});

Header.displayName = 'Header';