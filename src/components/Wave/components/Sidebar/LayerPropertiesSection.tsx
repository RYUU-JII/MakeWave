import React from 'react';
import type { WaveLayer, Sensitivity } from '../../waveTypes';

interface LayerPropertiesSectionProps {
    currentLayer: WaveLayer;
    sensitivity: Sensitivity;
    onPropChange: (field: any, val: string) => void;
    onSensitivityToggle: () => void;
}

export const LayerPropertiesSection: React.FC<LayerPropertiesSectionProps> = ({
    currentLayer,
    sensitivity,
    onPropChange,
    onSensitivityToggle,
}) => {
    return (
        <section className="properties-section">
            <div className="section-title">Layer Properties</div>

            <div className="prop-group">
                <label>Name</label>
                <input
                    name="id"
                    value={currentLayer.id}
                    onChange={(e) => onPropChange('id', e.target.value)}
                />
            </div>

            <div className="prop-group">
                <label>Color</label>
                <div className="color-input-wrapper">
                    <input
                        name="color"
                        value={currentLayer.color}
                        onChange={(e) => onPropChange('color', e.target.value)}
                    />
                    <input
                        type="color"
                        value={currentLayer.color}
                        onChange={(e) => onPropChange('color', e.target.value)}
                    />
                </div>
            </div>

            <div className="prop-group">
                <label>Opacity</label>
                <div className="range-wrapper">
                    <input
                        name="opacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={currentLayer.opacity}
                        onChange={(e) => onPropChange('opacity', e.target.value)}
                    />
                    <span>{Math.round(currentLayer.opacity * 100)}%</span>
                </div>
            </div>

            <div className="prop-group">
                <label>Vertical Offset</label>
                <div className="range-wrapper">
                    <input
                        name="offsetY"
                        type="range"
                        min="-300"
                        max="300"
                        value={currentLayer.offsetY}
                        onChange={(e) => onPropChange('offsetY', e.target.value)}
                    />
                    <span>{currentLayer.offsetY}px</span>
                </div>
            </div>

            <div className="prop-group">
                <label>Animation Speed</label>
                <div className="range-wrapper">
                    <input
                        name="speed"
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={currentLayer.speed}
                        onChange={(e) => onPropChange('speed', e.target.value)}
                    />
                    <span>{currentLayer.speed.toFixed(1)}x</span>
                </div>
            </div>

            <div className="prop-group">
                <label>Edit Sensitivity</label>
                <button
                    className={`sens-btn ${sensitivity === 'low' ? 'low' : ''}`}
                    onClick={onSensitivityToggle}
                >
                    {sensitivity === 'normal' ? 'Normal' : 'Low (Fine Control)'}
                </button>
            </div>
        </section>
    );
};
