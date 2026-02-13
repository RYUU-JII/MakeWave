export interface ControlPoint {
  x: number;
  y: number;
}

export interface WaveNode {
  id: string;
  x: number;
  y: number;
  cp1: ControlPoint;
  cp2: ControlPoint;
  isCorner: boolean;
}

export interface WaveLayer {
  id: string;
  color: string;
  opacity: number;
  offsetY: number;
  speed: number;
  foamIntensity: number;
  foamScale: number;
  stripeStrength: number;
  stripeSpacing: number;
  ridgeNodes: WaveNode[];
  hollowNodes: WaveNode[];
}

export type NodeListType = 'ridge' | 'hollow';
export type NodeHitType = 'anchor' | 'cp1' | 'cp2';

export interface NodeTarget {
  nodeId: string;
  type: NodeHitType;
  listType: NodeListType;
}

export interface SegmentTarget {
  type: 'segment';
  listType: NodeListType;
  idx: number;
  t: number;
}

export type HitTarget = NodeTarget | SegmentTarget;
export type DragTarget = NodeTarget;

export type Sensitivity = 'normal' | 'low';

export type LayerPropField =
  | 'id'
  | 'color'
  | 'opacity'
  | 'offsetY'
  | 'speed'
  | 'foamIntensity'
  | 'foamScale'
  | 'stripeStrength'
  | 'stripeSpacing';

export interface CanvasSettings {
  widthPx: number;
  heightPx: number;
  showGrid: boolean;
}

export interface AnimationSettings {
  playing: boolean;
  heaveAmplitudePx: number;
  timeScale: number;
}

export interface EditorSettings {
  showControls: boolean;
  sensitivity: Sensitivity;
  activeLayerId: string | null;
}

export interface WavePalette {
  paper: string;
  deepBlue: string;
  midBlue: string;
  lightBlue: string;
}

export interface ControlColorGuide {
  ridgeAnchor: string;
  hollowAnchor: string;
  handle: string;
  hover: string;
  segmentHover: string;
}

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
