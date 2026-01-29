import { useCallback } from 'react';

export const useFileHandlers = (
    onSaveRequested: () => string,
    onDataLoaded: (data: any, filePath?: string) => void
) => {

    // --- Save Logic ---
    const handleSave = useCallback(async (): Promise<string | null> => {
        const content = onSaveRequested();
        try {
            const result = await window.nssimulator.saveScenario(content);

            // Return path if successful
            if (typeof result === 'string') {
                console.log(`Saved to: ${result}`);
                return result;
            }
            return null;
        } catch (err) {
            console.error("Failed to save scenario", err);
            return null;
        }
    }, [onSaveRequested]);

    // --- Open Logic ---
    const handleOpen = useCallback(async () => {
        try {
            const result = await window.nssimulator.loadScenario();

            if (!result) return;

            let content: string;
            let path: string | undefined;

            if (typeof result === 'string') {
                content = result;
                path = undefined;
            } else {
                content = result.data;
                path = result.path;
            }

            if (content) {
                try {
                    const parsed = JSON.parse(content);
                    onDataLoaded(parsed, path);
                } catch (err) {
                    console.error("Failed to parse loaded file", err);
                }
            }
        } catch (err) {
            console.error("Failed to load scenario file", err);
        }
    }, [onDataLoaded]);

    return { handleSave, handleOpen };
};