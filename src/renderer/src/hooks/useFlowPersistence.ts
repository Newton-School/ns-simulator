import { useCallback } from 'react';
import useStore from '@renderer/store/useStore';
import { useFileHandlers } from './useFileHandlers';
import { convertFlatToNested, convertNestedToFlat, NestedFileData } from '@renderer/utils/nodeTransformers';

export const useFlowPersistence = () => {
    //Save Logic (Store -> Nested JSON) ---
    const handleGetFileData = useCallback(() => {
        const { nodes, edges } = useStore.getState();
        const nestedNodes = convertFlatToNested(nodes);

        return JSON.stringify({ nodes: nestedNodes, edges }, null, 2);
    }, []);

    //Load Logic (Nested JSON -> Store) ---
    const handleLoadFileData = useCallback((fileContent: string | object) => {
        try {
            // Parse (handle string vs object input)
            const data = (typeof fileContent === 'string'
                ? JSON.parse(fileContent)
                : fileContent) as NestedFileData;

            // Validate
            if (!data || !data.nodes) {
                throw new Error("Invalid file format: Missing 'nodes'");
            }

            // Transform & Update Store
            const flatNodes = convertNestedToFlat(data.nodes);

            useStore.getState().setNodes(flatNodes);

            // Update Edges (Default to empty array if missing)
            useStore.setState({ edges: data.edges || [] });

            console.log("Canvas loaded successfully.");

        } catch (error) {
            console.error("Failed to load flow:", error);
            alert("Error loading file. Please check the JSON format.");
        }
    }, []);

    //Bind to File System ---
    useFileHandlers(handleGetFileData, handleLoadFileData);
};