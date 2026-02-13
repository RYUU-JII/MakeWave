import React from 'react';

interface CompositionGuideSectionProps {
    showThirdsGuide: boolean;
    showHorizonGuide: boolean;
    horizonGuideY: number;
    onThirdsGuideToggle: (value: boolean) => void;
    onHorizonGuideToggle: (value: boolean) => void;
    onHorizonGuideYChange: (value: number) => void;
}

export const CompositionGuideSection: React.FC<CompositionGuideSectionProps> = ({
    showThirdsGuide,
    showHorizonGuide,
    horizonGuideY,
    onThirdsGuideToggle,
    onHorizonGuideToggle,
    onHorizonGuideYChange,
}) => {
    return (
        <section>
            <div className="section-title">Composition Guide</div>

            <div className="prop-group">
                <label className="checkbox-wrapper">
                    <input
                        type="checkbox"
                        checked={showThirdsGuide}
                        onChange={(e) => onThirdsGuideToggle(e.target.checked)}
                    />
                    Rule of Thirds
                </label>
            </div>

            <div className="prop-group">
                <label className="checkbox-wrapper">
                    <input
                        type="checkbox"
                        checked={showHorizonGuide}
                        onChange={(e) => onHorizonGuideToggle(e.target.checked)}
                    />
                    Horizon Guide
                </label>
            </div>

            <div className="prop-group">
                <label>Horizon Height</label>
                <div className="range-wrapper">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={horizonGuideY}
                        onChange={(e) => onHorizonGuideYChange(parseFloat(e.target.value))}
                        disabled={!showHorizonGuide}
                    />
                    <span>{Math.round(horizonGuideY * 100)}%</span>
                </div>
            </div>
        </section>
    );
};
