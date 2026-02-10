import type {
  AnimationSettings,
  CanvasSettings,
  ControlColorGuide,
  Sensitivity,
  WaveLayer,
  WaveNode,
  WavePalette,
} from './waveTypes';

const createNode = (
  id: string,
  x: number,
  y: number,
  cp1x: number = x,
  cp1y: number = y,
  cp2x: number = x,
  cp2y: number = y,
  isCorner: boolean = false,
): WaveNode => ({
  id,
  x,
  y,
  cp1: { x: cp1x, y: cp1y },
  cp2: { x: cp2x, y: cp2y },
  isCorner,
});

const cloneNode = (node: WaveNode, idSuffix = ''): WaveNode => ({
  ...node,
  id: `${node.id}${idSuffix}`,
  cp1: { ...node.cp1 },
  cp2: { ...node.cp2 },
});

export const cloneLayer = (layer: WaveLayer, idSuffix = ''): WaveLayer => ({
  ...layer,
  id: `${layer.id}${idSuffix}`,
  ridgeNodes: layer.ridgeNodes.map((node) => cloneNode(node, idSuffix)),
  hollowNodes: layer.hollowNodes.map((node) => cloneNode(node, idSuffix)),
});

export const WAVE_PALETTE: WavePalette = {
  paper: '#fdf5e6',
  deepBlue: '#1a3a5f',
  midBlue: '#2e5a88',
  lightBlue: '#5a8fb9',
};

export const CONTROL_COLORS: ControlColorGuide = {
  ridgeAnchor: '#c62828',
  hollowAnchor: '#1565c0',
  handle: 'rgba(0,0,0,0.55)',
  hover: '#ff00ff',
  segmentHover: '#ffe000',
};

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  widthPercent: 100,
  heightPx: 600,
  showGrid: true,
};

export const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  playing: false,
  heaveAmplitudePx: 15,
  timeScale: 0.0015,
};

export const DRAG_SENSITIVITY_FACTOR: Record<Sensitivity, number> = {
  normal: 1,
  low: 0.2,
};

export const HIT_RADIUS = 0.015;
export const SEGMENT_HIT_RADIUS = 0.01;

const BASE_STARTER_LAYER: WaveLayer = {
  id: 'Layer 1',
  color: WAVE_PALETTE.deepBlue,
  offsetY: 0,
  speed: 1,
  ridgeNodes: [
    createNode('r0', 0, 0.62, 0, 0.62, 0.24, 0.62),
    createNode('r1', 0.48, 0.62, 0.26, 0.62, 0.48, 0.62, true),
  ],
  hollowNodes: [
    createNode('h0', 0.48, 0.62, 0.48, 0.62, 0.66, 0.69, true),
    createNode('h1', 1, 0.78, 0.78, 0.76, 1, 0.78),
  ],
};

let layerSeed = 0;

const createBlankLayer = (nextIndex: number): WaveLayer => {
  layerSeed += 1;
  const suffix = `_L${nextIndex + 1}_${layerSeed}`;
  const layer = cloneLayer(BASE_STARTER_LAYER, suffix);
  layer.id = `Layer ${nextIndex + 1}`;
  layer.offsetY = nextIndex * 40;
  return layer;
};

export const createInitialLayers = (): WaveLayer[] => [createBlankLayer(0)];

export const createBlankLayerAt = (nextIndex: number): WaveLayer =>
  createBlankLayer(nextIndex);
