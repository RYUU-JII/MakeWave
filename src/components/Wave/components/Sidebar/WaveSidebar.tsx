import type { LayerPropField, WaveLayer, Sensitivity, ReferenceImage } from '../../waveTypes';
import { CanvasSettingsSection } from './CanvasSettingsSection';
import { CompositionGuideSection } from './CompositionGuideSection';
import { LayerSection } from './LayerSection';
import { LayerPropertiesSection } from './LayerPropertiesSection';
import { ReferenceImageSection } from './ReferenceImageSection';
import { StylePresetSection } from './StylePresetSection';
import { StudioWorkflowSection } from './StudioWorkflowSection';
import type { StylePreset } from '../../presets/stylePresets';

interface WaveSidebarProps {
    side: 'left' | 'right';
    layers: WaveLayer[];
    activeLayerIndex: number;
    canvasWidthPx: number;
    canvasHeightPx: number;
    showGrid: boolean;
    sensitivity: Sensitivity;
    isPlaying: boolean;
    exportMessage: string;
    showThirdsGuide: boolean;
    showHorizonGuide: boolean;
    horizonGuideY: number;
    onThirdsGuideToggle: (value: boolean) => void;
    onHorizonGuideToggle: (value: boolean) => void;
    onHorizonGuideYChange: (value: number) => void;
    onSelectLayer: (idx: number) => void;
    onAddLayer: () => void;
    onRemoveLayer: (idx: number) => void;
    onResetLayer: () => void;
    onLayerPropChange: (field: LayerPropField, val: string) => void;
    onApplyStylePreset: (preset: StylePreset) => void;
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
    side,
    layers,
    activeLayerIndex,
    canvasWidthPx,
    canvasHeightPx,
    showGrid,
    sensitivity,
    isPlaying,
    exportMessage,
    showThirdsGuide,
    showHorizonGuide,
    horizonGuideY,
    onThirdsGuideToggle,
    onHorizonGuideToggle,
    onHorizonGuideYChange,
    onSelectLayer,
    onAddLayer,
    onRemoveLayer,
    onResetLayer,
    onLayerPropChange,
    onApplyStylePreset,
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
        <aside className={`wave-sidebar ${side}`}>
            <header className="sidebar-header">
                <h3>{side === 'left' ? 'Composition' : 'Style Lab'}</h3>
                <button
                    onClick={onPlayToggle}
                    className={`play-toggle ${!isPlaying ? 'paused' : ''}`}
                >
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
            </header>

            {side === 'left' ? (
                <>
                    <CompositionGuideSection
                        showThirdsGuide={showThirdsGuide}
                        showHorizonGuide={showHorizonGuide}
                        horizonGuideY={horizonGuideY}
                        onThirdsGuideToggle={onThirdsGuideToggle}
                        onHorizonGuideToggle={onHorizonGuideToggle}
                        onHorizonGuideYChange={onHorizonGuideYChange}
                    />
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
                    <ReferenceImageSection
                        referenceImage={referenceImage}
                        onImageUpload={onImageUpload}
                        onUpdateImage={onUpdateImage}
                        onClear={onClearImage}
                    />
                </>
            ) : (
                <>
                    {currentLayer && (
                        <LayerPropertiesSection
                            currentLayer={currentLayer}
                            sensitivity={sensitivity}
                            onPropChange={onLayerPropChange}
                            onSensitivityToggle={onSensitivityToggle}
                        />
                    )}
                    <StylePresetSection onApplyPreset={onApplyStylePreset} />
                    <StudioWorkflowSection />
                </>
            )}

            {exportMessage && side === 'right' && <div className="export-message">{exportMessage}</div>}

            <footer className="sidebar-footer">
                {side === 'left' ? (
                    <button className="sidebar-add-btn" onClick={onAddLayer}>
                        Add Layer
                    </button>
                ) : (
                    <button className="json-btn" onClick={onExport}>
                        Export Scene
                    </button>
                )}
            </footer>
        </aside>
    );
};
