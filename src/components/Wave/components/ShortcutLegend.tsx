import React from 'react';

export const ShortcutLegend: React.FC = () => {
    return (
        <div className="shortcut-legend">
            <div className="shortcut-item">
                <span>Alt+Click (Line)</span>
                Add Point
            </div>
            <div className="shortcut-item">
                <span>Alt+Click (Point)</span>
                Delete
            </div>
            <div className="shortcut-item">
                <span>Double Click</span>
                Sharp/Smooth
            </div>
            <div className="shortcut-item">
                <span>Ctrl+Z</span>
                Undo
            </div>
        </div>
    );
};
