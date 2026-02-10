import type {
  AnimationSettings,
  CanvasSettings,
  ControlColorGuide,
  EditorSettings,
  WaveExportPayload,
  WaveLayer,
  WavePalette,
} from './waveTypes';

interface CreateWaveExportPayloadArgs {
  palette: WavePalette;
  controlColors: ControlColorGuide;
  canvas: CanvasSettings;
  animation: AnimationSettings;
  editor: EditorSettings;
  layers: WaveLayer[];
}

const cloneLayer = (layer: WaveLayer): WaveLayer => ({
  ...layer,
  ridgeNodes: layer.ridgeNodes.map((node) => ({
    ...node,
    cp1: { ...node.cp1 },
    cp2: { ...node.cp2 },
  })),
  hollowNodes: layer.hollowNodes.map((node) => ({
    ...node,
    cp1: { ...node.cp1 },
    cp2: { ...node.cp2 },
  })),
});

export const createWaveExportPayload = ({
  palette,
  controlColors,
  canvas,
  animation,
  editor,
  layers,
}: CreateWaveExportPayloadArgs): WaveExportPayload => ({
  schemaVersion: 'ukiyoe-wave/v1',
  exportedAt: new Date().toISOString(),
  palette: { ...palette },
  controlColors: { ...controlColors },
  canvas: { ...canvas },
  animation: { ...animation },
  editor: { ...editor },
  layers: layers.map(cloneLayer),
});
