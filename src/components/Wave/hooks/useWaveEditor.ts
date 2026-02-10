import { useCallback, useRef, useState } from 'react';
import {
    DEFAULT_ANIMATION_SETTINGS,
    DEFAULT_CANVAS_SETTINGS,
    createInitialLayers,
} from '../waveDefaults';
import type {
    Sensitivity,
    HitTarget,
    DragTarget,
    ReferenceImage
} from '../waveTypes';
import { useWaveHistory } from './useWaveHistory';

export const useWaveEditor = () => {
    const { layers, setLayers, undo, redo, pushToHistory } = useWaveHistory(createInitialLayers());
    const [activeLayerIndex, setActiveLayerIndex] = useState(0);
    const [canvasWidthPx, setCanvasWidthPx] = useState(DEFAULT_CANVAS_SETTINGS.widthPx);
    const [canvasHeightPx, setCanvasHeightPx] = useState(DEFAULT_CANVAS_SETTINGS.heightPx);
    const [showControls, setShowControls] = useState(true);
    const [showGrid, setShowGrid] = useState(DEFAULT_CANVAS_SETTINGS.showGrid);
    const [hoveredTarget, setHoveredTarget] = useState<HitTarget | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
    const [isPlaying, setIsPlaying] = useState(DEFAULT_ANIMATION_SETTINGS.playing);
    const [sensitivity, setSensitivity] = useState<Sensitivity>('normal');
    const [exportMessage, setExportMessage] = useState('');

    // Reference Image State
    const [refImage, setRefImage] = useState<ReferenceImage | null>(null);
    const refImageElemRef = useRef<HTMLImageElement | null>(null);

    const safeActiveLayerIndex = Math.min(activeLayerIndex, Math.max(0, layers.length - 1));
    const currentLayer = layers[safeActiveLayerIndex];

    const handleImageUpload = useCallback((image: HTMLImageElement, url: string) => {
        refImageElemRef.current = image;
        setRefImage({
            url,
            width: image.width,
            height: image.height,
            opacity: 0.5,
            visible: true
        });

        // Auto-resize canvas to match image aspect ratio
        const maxWidth = 1600;
        const maxHeight = 900;
        let newWidth = image.width;
        let newHeight = image.height;

        if (newWidth > maxWidth) {
            const scale = maxWidth / newWidth;
            newWidth = maxWidth;
            newHeight *= scale;
        }
        if (newHeight > maxHeight) {
            const scale = maxHeight / newHeight;
            newHeight = maxHeight;
            newWidth *= scale;
        }

        setCanvasWidthPx(Math.round(newWidth));
        setCanvasHeightPx(Math.round(newHeight));
    }, []);

    const handleUpdateRefImage = useCallback((updates: Partial<ReferenceImage>) => {
        setRefImage(prev => prev ? { ...prev, ...updates } : null);
    }, []);

    const handleClearRefImage = useCallback(() => {
        if (refImage?.url) URL.revokeObjectURL(refImage.url);
        refImageElemRef.current = null;
        setRefImage(null);
    }, [refImage]);

    return {
        layers, setLayers,
        activeLayerIndex, setActiveLayerIndex,
        safeActiveLayerIndex,
        currentLayer,
        canvasWidthPx, setCanvasWidthPx,
        canvasHeightPx, setCanvasHeightPx,
        showControls, setShowControls,
        showGrid, setShowGrid,
        hoveredTarget, setHoveredTarget,
        isDragging, setIsDragging,
        dragTarget, setDragTarget,
        isPlaying, setIsPlaying,
        sensitivity, setSensitivity,
        exportMessage, setExportMessage,
        refImage, setRefImage,
        refImageElemRef,
        undo, redo, pushToHistory,
        handleImageUpload,
        handleUpdateRefImage,
        handleClearRefImage
    };
};
