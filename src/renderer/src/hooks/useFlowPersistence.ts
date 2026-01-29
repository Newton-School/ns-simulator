import { useCallback, useEffect, useRef } from 'react';
import useStore from '@renderer/store/useStore';
import { useFileHandlers } from './useFileHandlers';
import { convertFlatToNested, convertNestedToFlat, NestedFileData } from '@renderer/utils/nodeTransformers';

export const useFlowPersistence = () => {

    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);
    const setNodes = useStore((s) => s.setNodes);
    const setEdges = useStore((s) => s.setEdges);
    const setFileName = useStore((s) => s.setFileName);
    const setUnsaved = useStore((s) => s.setUnsaved);

    // Ref to ignore the initial change caused by loading a file
    const isLoadingRef = useRef(false);

    // --- DATA PREP ---
    const handleGetFileData = useCallback(() => {
        const { nodes, edges } = useStore.getState();
        const nestedNodes = convertFlatToNested(nodes);
        return JSON.stringify({ nodes: nestedNodes, edges }, null, 2);
    }, []);

    // --- LOAD DATA ---
    const handleLoadFileData = useCallback((fileContent: string | object, filePath?: string) => {
        try {
            const data = (typeof fileContent === 'string'
                ? JSON.parse(fileContent)
                : fileContent) as NestedFileData;

            if (!data || !data.nodes) throw new Error("Invalid file format");

            const flatNodes = convertNestedToFlat(data.nodes);

            // --- SET LOADING FLAG ---
            // prevent dirty checks from firing while we update state
            isLoadingRef.current = true;

            // --- UPDATE STATE ---
            setNodes(flatNodes);
            setEdges(data.edges || []);
            setUnsaved(false); // Ensure clean state

            // HANDLE FILENAME
            if (filePath && typeof filePath === 'string') {
                const name = filePath.replace(/^.*[\\/]/, '');
                setFileName(name);
            }

            // CLEAR LOADING FLAG (Delayed)
            // Use setTimeout to ensure this runs AFTER React has finished 
            setTimeout(() => {
                isLoadingRef.current = false;
            }, 100);

        } catch (error) {
            console.error("Failed to load flow:", error);
            alert("Error loading file.");
            isLoadingRef.current = false;
        }
    }, [setNodes, setEdges, setFileName, setUnsaved]);

    // --- GET HANDLERS ---
    const { handleSave: innerSave, handleOpen } = useFileHandlers(handleGetFileData, handleLoadFileData);

    // --- WRAPPER FOR SAVE (Updates UI) ---
    const handleSaveWrapper = useCallback(async () => {
        const savedPath = await innerSave();
        if (savedPath && typeof savedPath === 'string') {
            const name = savedPath.replace(/^.*[\\/]/, '');
            setFileName(name);
            setUnsaved(false);
        }
    }, [innerSave, setFileName, setUnsaved]);

    // --- SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            if (isMod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSaveWrapper();
            }
            if (isMod && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                handleOpen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSaveWrapper, handleOpen]);

    // --- DIRTY CHECK ---
    useEffect(() => {
        // If we are currently loading, DO NOT mark as dirty
        if (isLoadingRef.current) {
            return;
        }

        // If nodes exist (and we aren't loading), user must have changed something
        if (nodes.length > 0) {
            setUnsaved(true);
        }
    }, [nodes, edges, setUnsaved]);

    return { handleSave: handleSaveWrapper, handleOpen };
};