import { useEffect } from 'react';

export const useFileHandlers = (
    onSaveRequested: () => string, // Function to get current state
    onDataLoaded: (data: any) => void // Function to handle loaded data
) => {
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;

            // --- Cmd/Ctrl + S (Save) ---
            if (isMod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                const content = onSaveRequested();
                const path = await window.nssimulator.saveScenario(content);
                console.log(`Saved to: ${path}`);
            }

            // --- Cmd/Ctrl + O (Open) ---
            if (isMod && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                const content = await window.nssimulator.loadScenario();
                if (content) {
                    try {
                        const parsed = JSON.parse(content);
                        onDataLoaded(parsed);
                    } catch (err) {
                        console.error("Failed to parse loaded file", err);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSaveRequested, onDataLoaded]);
};