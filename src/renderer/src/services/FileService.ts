export const FileService = {
    save: async (content: string): Promise<string | null> => {
        try {
            const result = await window.nssimulator.saveScenario(content);
            return typeof result === 'string' ? result : null;
        } catch (error) {
            console.error('[FileService] Save failed:', error);
            return null;
        }
    },

    load: async (): Promise<{ content: string; path?: string } | null> => {
        try {
            const result = await window.nssimulator.loadScenario();
            if (!result) return null;

            if (typeof result === 'string') {
                return { content: result, path: undefined };
            }
            return { content: result.data, path: result.path };
        } catch (error) {
            console.error('[FileService] Load failed:', error);
            return null;
        }
    }
};