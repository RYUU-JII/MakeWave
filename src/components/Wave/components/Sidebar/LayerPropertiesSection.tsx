import React from 'react';
import type { LayerPropField, WaveLayer, Sensitivity } from '../../waveTypes';

interface LayerPropertiesSectionProps {
    currentLayer: WaveLayer;
    sensitivity: Sensitivity;
    onPropChange: (field: LayerPropField, val: string) => void;
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
                <label>Foam Intensity</label>
                <div className="range-wrapper">
                    <input
                        name="foamIntensity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={currentLayer.foamIntensity}
                        onChange={(e) => onPropChange('foamIntensity', e.target.value)}
                    />
                    <span>{Math.round(currentLayer.foamIntensity * 100)}%</span>
                </div>
            </div>

            <div className="prop-group">
                <label>Foam Scale</label>
                <div className="range-wrapper">
                    <input
                        name="foamScale"
                        type="range"
                        min="0.4"
                        max="2"
                        step="0.05"
                        value={currentLayer.foamScale}
                        onChange={(e) => onPropChange('foamScale', e.target.value)}
                    />
                    <span>{currentLayer.foamScale.toFixed(2)}x</span>
                </div>
            </div>

            <div className="prop-group">
                <label>Vertical Stripe Strength</label>
                <div className="range-wrapper">
                    <input
                        name="stripeStrength"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={currentLayer.stripeStrength}
                        onChange={(e) => onPropChange('stripeStrength', e.target.value)}
                    />
                    <span>{Math.round(currentLayer.stripeStrength * 100)}%</span>
                </div>
            </div>

            <div className="prop-group">
                <label>Stripe Spacing</label>
                <div className="range-wrapper">
                    <input
                        name="stripeSpacing"
                        type="range"
                        min="0.03"
                        max="0.2"
                        step="0.005"
                        value={currentLayer.stripeSpacing}
                        onChange={(e) => onPropChange('stripeSpacing', e.target.value)}
                    />
                    <span>{currentLayer.stripeSpacing.toFixed(3)}</span>
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
