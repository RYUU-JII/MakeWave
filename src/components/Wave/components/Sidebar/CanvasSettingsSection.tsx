import React from 'react';

interface CanvasSettingsSectionProps {
    widthPx: number;
    heightPx: number;
    showGrid: boolean;
    onWidthChange: (val: number) => void;
    onHeightChange: (val: number) => void;
    onGridToggle: (val: boolean) => void;
    onReset: () => void;
}

export const CanvasSettingsSection: React.FC<CanvasSettingsSectionProps> = ({
    widthPx,
    heightPx,
    showGrid,
    onWidthChange,
    onHeightChange,
    onGridToggle,
    onReset,
}) => {
    return (
        <section className="canvas-section">
            <div className="section-title">
                <span>Canvas Settings</span>
                <button className="icon-btn" onClick={onReset} title="Reset Size">
                    Reset
                </button>
            </div>

            <div className="prop-group">
                <label>Width (px)</label>
                <div className="range-wrapper">
                    <input
                        type="range"
                        min="300"
                        max="2000"
                        step="10"
                        value={widthPx}
                        onChange={(e) => onWidthChange(parseInt(e.target.value, 10))}
                    />
                    <span>{widthPx}px</span>
                </div>
            </div>

            <div className="prop-group">
                <label>Height (px)</label>
                <div className="range-wrapper">
                    <input
                        type="range"
                        min="300"
                        max="1000"
                        step="10"
                        value={heightPx}
                        onChange={(e) => onHeightChange(parseInt(e.target.value, 10))}
                    />
                    <span>{heightPx}px</span>
                </div>
            </div>

            <div className="prop-group">
                <label className="checkbox-wrapper" htmlFor="gridCheck">
                    <input
                        type="checkbox"
                        id="gridCheck"
                        checked={showGrid}
                        onChange={(e) => onGridToggle(e.target.checked)}
                    />
                    Show Grid
                </label>
            </div>
        </section>
    );
};
