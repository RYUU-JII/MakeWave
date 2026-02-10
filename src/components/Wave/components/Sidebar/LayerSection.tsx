import React from 'react';
import type { WaveLayer } from '../../waveTypes';

interface LayerSectionProps {
    layers: WaveLayer[];
    activeLayerIndex: number;
    onSelectLayer: (idx: number) => void;
    onRemoveLayer: (idx: number) => void;
    onResetLayer: () => void;
}

export const LayerSection: React.FC<LayerSectionProps> = ({
    layers,
    activeLayerIndex,
    onSelectLayer,
    onRemoveLayer,
    onResetLayer,
}) => {
    return (
        <section className="layer-section">
            <div className="section-title">
                <span>Layers</span>
                <button
                    className="icon-btn"
                    onClick={onResetLayer}
                    title="Reset current layer shape"
                >
                    Reset Layer
                </button>
            </div>

            <div className="layer-list">
                {layers.map((layer, index) => (
                    <div
                        key={layer.id}
                        className={`layer-item ${index === activeLayerIndex ? 'active' : ''}`}
                        onClick={() => onSelectLayer(index)}
                    >
                        <div
                            className="layer-color-preview"
                            style={{ backgroundColor: layer.color }}
                        />
                        <span className="layer-name">{layer.id}</span>
                        <button
                            className="icon-btn delete-layer-item-btn"
                            onClick={(event) => {
                                event.stopPropagation();
                                onRemoveLayer(index);
                            }}
                            title="Delete layer"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
};
