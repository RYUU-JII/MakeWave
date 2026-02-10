import { useCallback, useState } from 'react';
import type { WaveLayer } from '../waveTypes';

export const useWaveHistory = (initialLayers: WaveLayer[]) => {
    const [layers, setLayers] = useState<WaveLayer[]>(initialLayers);
    const [history, setHistory] = useState<WaveLayer[][]>([]);
    const [redoStack, setRedoStack] = useState<WaveLayer[][]>([]);

    const pushToHistory = useCallback(() => {
        setHistory((prev) => [...prev, layers].slice(-3));
        setRedoStack([]);
    }, [layers]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        setRedoStack((prevStack) => [layers, ...prevStack].slice(0, 3));
        setHistory(newHistory);
        setLayers(prev);
    }, [history, layers]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const next = redoStack[0];
        const newRedo = redoStack.slice(1);
        setHistory((prevHist) => [...prevHist, layers].slice(-3));
        setRedoStack(newRedo);
        setLayers(next);
    }, [redoStack, layers]);

    return {
        layers,
        setLayers,
        undo,
        redo,
        pushToHistory,
    };
};
