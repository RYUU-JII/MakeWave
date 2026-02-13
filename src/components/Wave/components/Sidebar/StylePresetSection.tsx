import React from 'react';
import type { StylePreset } from '../../presets/stylePresets';

interface StylePresetSectionProps {
    onApplyPreset: (preset: StylePreset) => void;
}

export const StylePresetSection: React.FC<StylePresetSectionProps> = ({ onApplyPreset }) => {
    return (
        <section>
            <div className="section-title">Great Wave Style Presets</div>
            <div className="preset-grid">
                <button className="preset-btn" onClick={() => onApplyPreset('claw-crest')}>
                    Claw Crest
                </button>
                <button className="preset-btn" onClick={() => onApplyPreset('spray-fractal')}>
                    Spray Fractal
                </button>
                <button className="preset-btn" onClick={() => onApplyPreset('undertow-band')}>
                    Undertow Band
                </button>
            </div>
            <p className="section-help">프리셋은 현재 선택된 레이어의 포말/세로무늬/속도 값을 빠르게 세팅합니다.</p>
        </section>
    );
};
