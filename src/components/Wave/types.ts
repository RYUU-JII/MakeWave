import type {
    AnimationSettings,
    CanvasSettings,
    ControlColorGuide,
    EditorSettings,
    WaveLayer,
    WavePalette,
} from './waveTypes';

export interface ReferenceImage {
    url: string;
    width: number;
    height: number;
    opacity: number;
    visible: boolean;
}

export interface WaveExportPayload {
    schemaVersion: 'ukiyoe-wave/v1';
    exportedAt: string;
    palette: WavePalette;
    controlColors: ControlColorGuide;
    canvas: CanvasSettings;
    animation: AnimationSettings;
    editor: EditorSettings;
    layers: WaveLayer[];
    referenceImage?: ReferenceImage;
}
