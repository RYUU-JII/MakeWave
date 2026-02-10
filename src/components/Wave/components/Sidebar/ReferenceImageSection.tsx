import React, { useRef } from 'react';
import type { ReferenceImage } from '../../waveTypes';

interface ReferenceImageSectionProps {
    referenceImage: ReferenceImage | null;
    onImageUpload: (image: HTMLImageElement, url: string) => void;
    onUpdateImage: (updates: Partial<ReferenceImage>) => void;
    onClear: () => void;
}

export const ReferenceImageSection: React.FC<ReferenceImageSectionProps> = ({
    referenceImage,
    onImageUpload,
    onUpdateImage,
    onClear,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            onImageUpload(img, url);
        };
        img.src = url;
    };

    return (
        <section className="reference-image-section">
            <div className="section-title">
                <span>Reference Image</span>
                {referenceImage && (
                    <button className="icon-btn" onClick={onClear}>
                        Clear
                    </button>
                )}
            </div>

            {!referenceImage ? (
                <div className="upload-container">
                    <button
                        className="sidebar-add-btn"
                        style={{ width: '100%', marginBottom: 0 }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Import Image
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <p style={{ fontSize: '10px', color: '#888', marginTop: '6px', textAlign: 'center' }}>
                        Tracing guide for your waves
                    </p>
                </div>
            ) : (
                <>
                    <div className="prop-group">
                        <label className="checkbox-wrapper">
                            <input
                                type="checkbox"
                                checked={referenceImage.visible}
                                onChange={(e) => onUpdateImage({ visible: e.target.checked })}
                            />
                            Show Image
                        </label>
                    </div>

                    <div className="prop-group">
                        <label>Image Opacity</label>
                        <div className="range-wrapper">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={referenceImage.opacity}
                                onChange={(e) => onUpdateImage({ opacity: parseFloat(e.target.value) })}
                            />
                            <span>{Math.round(referenceImage.opacity * 100)}%</span>
                        </div>
                    </div>

                    <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                        {referenceImage.width}x{referenceImage.height}px
                    </div>
                </>
            )}
        </section>
    );
};
