import { useCallback } from 'react';
import { FileService } from '../services/FileService';

export const useFileHandlers = (
    onSaveRequested: () => string,
    onDataLoaded: (data: any, filePath?: string) => void
) => {

    const handleSave = useCallback(async () => {
        const content = onSaveRequested();

        const savedPath = await FileService.save(content);

        if (savedPath) {
            console.log(`Saved to: ${savedPath}`);
        }

        return savedPath;
    }, [onSaveRequested]);

    const handleOpen = useCallback(async () => {

        const file = await FileService.load();

        if (!file?.content) return;

        try {
            const parsedData = JSON.parse(file.content);
            onDataLoaded(parsedData, file.path);
        } catch (err) {
            console.error("[useFileHandlers] Failed to parse JSON content", err);
        }
    }, [onDataLoaded]);

    return { handleSave, handleOpen };
};