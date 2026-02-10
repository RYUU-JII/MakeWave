import type { WaveLayer, Sensitivity, ReferenceImage } from '../../waveTypes';
import { CanvasSettingsSection } from './CanvasSettingsSection';
import { LayerSection } from './LayerSection';
import { LayerPropertiesSection } from './LayerPropertiesSection';
import { ReferenceImageSection } from './ReferenceImageSection';

interface WaveSidebarProps {
    layers: WaveLayer[];
    activeLayerIndex: number;
    canvasWidthPx: number;
    canvasHeightPx: number;
    showGrid: boolean;
    sensitivity: Sensitivity;
    isPlaying: boolean;
    exportMessage: string;
    onSelectLayer: (idx: number) => void;
    onAddLayer: () => void;
    onRemoveLayer: (idx: number) => void;
    onResetLayer: () => void;
    onLayerPropChange: (field: any, val: string) => void;
    onSensitivityToggle: () => void;
    onPlayToggle: () => void;
    onCanvasWidthChange: (val: number) => void;
    onCanvasHeightChange: (val: number) => void;
    onGridToggle: (val: boolean) => void;
    onCanvasReset: () => void;
    onExport: () => void;
    referenceImage: ReferenceImage | null;
    onImageUpload: (image: HTMLImageElement, url: string) => void;
    onUpdateImage: (updates: Partial<ReferenceImage>) => void;
    onClearImage: () => void;
}

export const WaveSidebar: React.FC<WaveSidebarProps> = ({
    layers,
    activeLayerIndex,
    canvasWidthPx,
    canvasHeightPx,
    showGrid,
    sensitivity,
    isPlaying,
    exportMessage,
    onSelectLayer,
    onAddLayer,
    onRemoveLayer,
    onResetLayer,
    onLayerPropChange,
    onSensitivityToggle,
    onPlayToggle,
    onCanvasWidthChange,
    onCanvasHeightChange,
    onGridToggle,
    onCanvasReset,
    onExport,
    referenceImage,
    onImageUpload,
    onUpdateImage,
    onClearImage,
}) => {
    const currentLayer = layers[activeLayerIndex];

    return (
        <div className="wave-sidebar">
            <header className="sidebar-header">
                <h3>Wave Editor</h3>
                <button
                    onClick={onPlayToggle}
                    className={`play-toggle ${!isPlaying ? 'paused' : ''}`}
                >
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
            </header>

            <CanvasSettingsSection
                widthPx={canvasWidthPx}
                heightPx={canvasHeightPx}
                showGrid={showGrid}
                onWidthChange={onCanvasWidthChange}
                onHeightChange={onCanvasHeightChange}
                onGridToggle={onGridToggle}
                onReset={onCanvasReset}
            />

            <LayerSection
                layers={layers}
                activeLayerIndex={activeLayerIndex}
                onSelectLayer={onSelectLayer}
                onRemoveLayer={onRemoveLayer}
                onResetLayer={onResetLayer}
            />

            {currentLayer && (
                <LayerPropertiesSection
                    currentLayer={currentLayer}
                    sensitivity={sensitivity}
                    onPropChange={onLayerPropChange}
                    onSensitivityToggle={onSensitivityToggle}
                />
            )}

            <ReferenceImageSection
                referenceImage={referenceImage}
                onImageUpload={onImageUpload}
                onUpdateImage={onUpdateImage}
                onClear={onClearImage}
            />

            {exportMessage && <div className="export-message">{exportMessage}</div>}

            <footer className="sidebar-footer">
                <button className="sidebar-add-btn" onClick={onAddLayer}>
                    Add Layer
                </button>
                <button className="json-btn" onClick={onExport}>
                    Export Scene
                </button>
            </footer>
        </div>
    );
};
