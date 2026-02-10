
import React, { useEffect, useRef, useState } from 'react';
import './GreatWave.css';
import {
  CONTROL_COLORS,
  createBlankLayerAt,
  DEFAULT_ANIMATION_SETTINGS,
  DEFAULT_CANVAS_SETTINGS,
  DRAG_SENSITIVITY_FACTOR,
  HIT_RADIUS,
  SEGMENT_HIT_RADIUS,
  WAVE_PALETTE,
  cloneLayer,
  createInitialLayers,
} from './waveDefaults';
import { getDistToCubicBezier, splitCubicBezier } from './waveGeometry';
import { createWaveExportPayload } from './waveExport';
import type {
  DragTarget,
  HitTarget,
  NodeListType,
  Sensitivity,
  WaveLayer,
  WaveNode,
} from './waveTypes';

interface MousePosition {
  x: number;
  y: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const getX = (x: number, width: number): number => Math.round(width * x);

const getY = (
  y: number,
  height: number,
  offsetY: number,
  heave: number,
): number => Math.round(height * y + offsetY + heave);

const getHeave = (elapsedMs: number, speed: number): number => {
  const t = elapsedMs * DEFAULT_ANIMATION_SETTINGS.timeScale * speed;
  return Math.sin(t) * DEFAULT_ANIMATION_SETTINGS.heaveAmplitudePx;
};

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 1;
  const step = 50;

  ctx.beginPath();
  for (let x = 0; x <= width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.restore();
};

const getNodeListByType = (
  layer: WaveLayer,
  listType: NodeListType,
): WaveNode[] => (listType === 'ridge' ? layer.ridgeNodes : layer.hollowNodes);

const setNodeListByType = (
  layer: WaveLayer,
  listType: NodeListType,
  nodes: WaveNode[],
): WaveLayer => {
  if (listType === 'ridge') {
    return { ...layer, ridgeNodes: nodes };
  }
  return { ...layer, hollowNodes: nodes };
};

const createNodeId = (): string =>
  `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const GreatWave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [layers, setLayers] = useState<WaveLayer[]>(() => createInitialLayers());
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [canvasWidthPercent, setCanvasWidthPercent] = useState(
    DEFAULT_CANVAS_SETTINGS.widthPercent,
  );
  const [canvasHeightPx, setCanvasHeightPx] = useState(
    DEFAULT_CANVAS_SETTINGS.heightPx,
  );
  const [showControls, setShowControls] = useState(true);
  const [showGrid, setShowGrid] = useState(DEFAULT_CANVAS_SETTINGS.showGrid);
  const [hoveredTarget, setHoveredTarget] = useState<HitTarget | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [isPlaying, setIsPlaying] = useState(DEFAULT_ANIMATION_SETTINGS.playing);
  const [sensitivity, setSensitivity] = useState<Sensitivity>('normal');
  const [exportMessage, setExportMessage] = useState('');
  const safeActiveLayerIndex = Math.min(
    activeLayerIndex,
    Math.max(0, layers.length - 1),
  );

  const layersRef = useRef(layers);
  const activeIndexRef = useRef(activeLayerIndex);
  const showControlsRef = useRef(showControls);
  const showGridRef = useRef(showGrid);
  const hoveredTargetRef = useRef<HitTarget | null>(hoveredTarget);
  const isPlayingRef = useRef(isPlaying);
  const totalElapsedRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const dragPrevPosRef = useRef<MousePosition | null>(null);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    activeIndexRef.current = safeActiveLayerIndex;
  }, [safeActiveLayerIndex]);

  useEffect(() => {
    showControlsRef.current = showControls;
  }, [showControls]);

  useEffect(() => {
    showGridRef.current = showGrid;
  }, [showGrid]);

  useEffect(() => {
    hoveredTargetRef.current = hoveredTarget;
  }, [hoveredTarget]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!exportMessage) {
      return;
    }
    const timer = window.setTimeout(() => setExportMessage(''), 2000);
    return () => window.clearTimeout(timer);
  }, [exportMessage]);

  const syncTip = (layer: WaveLayer, sourceList: NodeListType): WaveLayer => {
    if (layer.ridgeNodes.length === 0 || layer.hollowNodes.length === 0) {
      return layer;
    }

    const ridgeTipIndex = layer.ridgeNodes.length - 1;
    const ridgeTip = layer.ridgeNodes[ridgeTipIndex];
    const hollowTip = layer.hollowNodes[0];

    if (sourceList === 'ridge') {
      const nextHollow = [...layer.hollowNodes];
      nextHollow[0] = { ...hollowTip, x: ridgeTip.x, y: ridgeTip.y };
      return { ...layer, hollowNodes: nextHollow };
    }

    const nextRidge = [...layer.ridgeNodes];
    nextRidge[ridgeTipIndex] = { ...ridgeTip, x: hollowTip.x, y: hollowTip.y };
    return { ...layer, ridgeNodes: nextRidge };
  };

  const getMousePos = (event: React.MouseEvent): MousePosition => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return { x: clamp01(x), y: clamp01(y) };
  };

  const getActiveLayerYOffsetNorm = (): number => {
    const layer = layersRef.current[activeIndexRef.current];
    const canvas = canvasRef.current;
    if (!layer || !canvas) {
      return 0;
    }

    const height = Math.max(1, canvas.clientHeight);
    const heave = getHeave(totalElapsedRef.current, layer.speed);
    return (layer.offsetY + heave) / height;
  };

  const getHitPoint = (nx: number, ny: number): HitTarget | null => {
    const layer = layersRef.current[activeIndexRef.current];
    if (!layer) {
      return null;
    }

    const layerSpaceY = ny - getActiveLayerYOffsetNorm();

    const checkNode = (
      node: WaveNode,
      listType: NodeListType,
    ): HitTarget | null => {
      if (
        (node.x - nx) * (node.x - nx) +
          (node.y - layerSpaceY) * (node.y - layerSpaceY) <
        HIT_RADIUS * HIT_RADIUS
      ) {
        return { nodeId: node.id, type: 'anchor', listType };
      }
      if (
        (node.cp1.x - nx) * (node.cp1.x - nx) +
          (node.cp1.y - layerSpaceY) * (node.cp1.y - layerSpaceY) <
        HIT_RADIUS * HIT_RADIUS
      ) {
        return { nodeId: node.id, type: 'cp1', listType };
      }
      if (
        (node.cp2.x - nx) * (node.cp2.x - nx) +
          (node.cp2.y - layerSpaceY) * (node.cp2.y - layerSpaceY) <
        HIT_RADIUS * HIT_RADIUS
      ) {
        return { nodeId: node.id, type: 'cp2', listType };
      }
      return null;
    };

    for (const node of layer.ridgeNodes) {
      const hit = checkNode(node, 'ridge');
      if (hit) {
        return hit;
      }
    }

    for (const node of layer.hollowNodes) {
      const hit = checkNode(node, 'hollow');
      if (hit) {
        return hit;
      }
    }

    const checkSegment = (
      nodes: WaveNode[],
      listType: NodeListType,
    ): HitTarget | null => {
      for (let i = 0; i < nodes.length - 1; i += 1) {
        const current = nodes[i];
        const next = nodes[i + 1];
        const { dist, t } = getDistToCubicBezier(
          { x: nx, y: layerSpaceY },
          { x: current.x, y: current.y },
          current.cp2,
          next.cp1,
          { x: next.x, y: next.y },
        );

        if (dist < SEGMENT_HIT_RADIUS) {
          return { type: 'segment', listType, idx: i, t };
        }
      }
      return null;
    };

    return (
      checkSegment(layer.ridgeNodes, 'ridge') ||
      checkSegment(layer.hollowNodes, 'hollow')
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    let frameId = 0;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
      }
    });

    resizeObserver.observe(canvas);

    const render = (time: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = time;
      }

      const delta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      if (isPlayingRef.current) {
        totalElapsedRef.current += delta;
      }

      const logicalWidth = canvas.width / window.devicePixelRatio;
      const logicalHeight = canvas.height / window.devicePixelRatio;

      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      ctx.fillStyle = WAVE_PALETTE.paper;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      if (showControlsRef.current && showGridRef.current) {
        drawGrid(ctx, logicalWidth, logicalHeight);
      }

      const currentLayers = layersRef.current;
      const activeIdx = activeIndexRef.current;
      const hovered = hoveredTargetRef.current;

      currentLayers.forEach((layer, idx) => {
        const isActive = idx === activeIdx;
        const controlsVisible = showControlsRef.current && isActive;

        ctx.globalAlpha = showControlsRef.current
          ? isActive
            ? 1
            : 0.2
          : 1;

        const heave = getHeave(totalElapsedRef.current, layer.speed);
        const offsetY = layer.offsetY;

        const ridgeStart = layer.ridgeNodes[0];
        if (!ridgeStart) {
          return;
        }

        ctx.beginPath();
        ctx.fillStyle = layer.color;
        ctx.moveTo(0, logicalHeight);
        ctx.lineTo(0, getY(ridgeStart.y, logicalHeight, offsetY, heave));
        ctx.lineTo(
          getX(ridgeStart.x, logicalWidth),
          getY(ridgeStart.y, logicalHeight, offsetY, heave),
        );

        for (let i = 0; i < layer.ridgeNodes.length - 1; i += 1) {
          const current = layer.ridgeNodes[i];
          const next = layer.ridgeNodes[i + 1];

          ctx.bezierCurveTo(
            getX(current.cp2.x, logicalWidth),
            getY(current.cp2.y, logicalHeight, offsetY, heave),
            getX(next.cp1.x, logicalWidth),
            getY(next.cp1.y, logicalHeight, offsetY, heave),
            getX(next.x, logicalWidth),
            getY(next.y, logicalHeight, offsetY, heave),
          );
        }

        for (let i = 0; i < layer.hollowNodes.length - 1; i += 1) {
          const current = layer.hollowNodes[i];
          const next = layer.hollowNodes[i + 1];

          ctx.bezierCurveTo(
            getX(current.cp2.x, logicalWidth),
            getY(current.cp2.y, logicalHeight, offsetY, heave),
            getX(next.cp1.x, logicalWidth),
            getY(next.cp1.y, logicalHeight, offsetY, heave),
            getX(next.x, logicalWidth),
            getY(next.y, logicalHeight, offsetY, heave),
          );
        }

        ctx.lineTo(logicalWidth, logicalHeight);
        ctx.closePath();
        ctx.fill();

        if (controlsVisible && hovered?.type === 'segment') {
          const drawSegmentHighlight = (nodes: WaveNode[], segmentIndex: number) => {
            const current = nodes[segmentIndex];
            const next = nodes[segmentIndex + 1];
            if (!current || !next) {
              return;
            }
            ctx.save();
            ctx.strokeStyle = CONTROL_COLORS.segmentHover;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(
              getX(current.x, logicalWidth),
              getY(current.y, logicalHeight, offsetY, heave),
            );
            ctx.bezierCurveTo(
              getX(current.cp2.x, logicalWidth),
              getY(current.cp2.y, logicalHeight, offsetY, heave),
              getX(next.cp1.x, logicalWidth),
              getY(next.cp1.y, logicalHeight, offsetY, heave),
              getX(next.x, logicalWidth),
              getY(next.y, logicalHeight, offsetY, heave),
            );
            ctx.stroke();
            ctx.restore();
          };

          if (hovered.listType === 'ridge') {
            drawSegmentHighlight(layer.ridgeNodes, hovered.idx);
          } else {
            drawSegmentHighlight(layer.hollowNodes, hovered.idx);
          }
        }

        if (!controlsVisible) {
          return;
        }

        const drawNodeControls = (node: WaveNode, anchorColor: string) => {
          const anchorX = getX(node.x, logicalWidth);
          const anchorY = getY(node.y, logicalHeight, offsetY, heave);
          const cp1X = getX(node.cp1.x, logicalWidth);
          const cp1Y = getY(node.cp1.y, logicalHeight, offsetY, heave);
          const cp2X = getX(node.cp2.x, logicalWidth);
          const cp2Y = getY(node.cp2.y, logicalHeight, offsetY, heave);

          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(cp1X, cp1Y);
          ctx.lineTo(anchorX, anchorY);
          ctx.lineTo(cp2X, cp2Y);
          ctx.stroke();
          ctx.setLineDash([]);

          const isAnchorHover =
            hovered?.type !== 'segment' &&
            hovered?.nodeId === node.id &&
            hovered.type === 'anchor';

          ctx.fillStyle = isAnchorHover ? CONTROL_COLORS.hover : anchorColor;
          ctx.beginPath();
          if (node.isCorner) {
            ctx.rect(anchorX - 6, anchorY - 6, 12, 12);
          } else {
            ctx.arc(anchorX, anchorY, 6, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();

          const isCp1Hover =
            hovered?.type !== 'segment' &&
            hovered?.nodeId === node.id &&
            hovered.type === 'cp1';
          ctx.fillStyle = isCp1Hover ? CONTROL_COLORS.hover : CONTROL_COLORS.handle;
          ctx.beginPath();
          ctx.arc(cp1X, cp1Y, 4, 0, Math.PI * 2);
          ctx.fill();

          const isCp2Hover =
            hovered?.type !== 'segment' &&
            hovered?.nodeId === node.id &&
            hovered.type === 'cp2';
          ctx.fillStyle = isCp2Hover ? CONTROL_COLORS.hover : CONTROL_COLORS.handle;
          ctx.beginPath();
          ctx.arc(cp2X, cp2Y, 4, 0, Math.PI * 2);
          ctx.fill();
        };

        layer.ridgeNodes.forEach((node) =>
          drawNodeControls(node, CONTROL_COLORS.ridgeAnchor),
        );
        layer.hollowNodes.forEach((node) =>
          drawNodeControls(node, CONTROL_COLORS.hollowAnchor),
        );
      });

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!showControlsRef.current) {
      return;
    }

    const { x, y } = getMousePos(event);
    const hit = getHitPoint(x, y);

    if (event.altKey && hit) {
      setLayers((prevLayers) => {
        const targetIndex = activeIndexRef.current;
        if (!prevLayers[targetIndex]) {
          return prevLayers;
        }

        const nextLayers = [...prevLayers];
        let layer = cloneLayer(prevLayers[targetIndex]);

        const listType = hit.listType;
        const originalList = getNodeListByType(layer, listType);
        const list = [...originalList];

        if (hit.type === 'anchor') {
          const nodeIndex = list.findIndex((node) => node.id === hit.nodeId);
          const cannotDeleteRidgeStart = listType === 'ridge' && nodeIndex === 0;
          const cannotDeleteHollowTail =
            listType === 'hollow' && nodeIndex === list.length - 1;

          if (
            nodeIndex === -1 ||
            list.length <= 2 ||
            cannotDeleteRidgeStart ||
            cannotDeleteHollowTail
          ) {
            return prevLayers;
          }

          const wasListTail = nodeIndex === list.length - 1;
          const wasListHead = nodeIndex === 0;
          list.splice(nodeIndex, 1);
          layer = setNodeListByType(layer, listType, list);

          if (listType === 'ridge' && wasListTail) {
            layer = syncTip(layer, 'ridge');
          }
          if (listType === 'hollow' && wasListHead) {
            layer = syncTip(layer, 'hollow');
          }
        }

        if (hit.type === 'segment') {
          const segmentIndex = hit.idx;
          if (!list[segmentIndex] || !list[segmentIndex + 1]) {
            return prevLayers;
          }

          const left = list[segmentIndex];
          const right = list[segmentIndex + 1];

          const [leftSegment, rightSegment] = splitCubicBezier(
            { x: left.x, y: left.y },
            left.cp2,
            right.cp1,
            { x: right.x, y: right.y },
            hit.t,
          );

          const inserted: WaveNode = {
            id: createNodeId(),
            x: leftSegment[3].x,
            y: leftSegment[3].y,
            cp1: leftSegment[2],
            cp2: rightSegment[1],
            isCorner: false,
          };

          list[segmentIndex] = { ...left, cp2: leftSegment[1] };
          list.splice(segmentIndex + 1, 0, inserted);
          list[segmentIndex + 2] = { ...right, cp1: rightSegment[2] };

          layer = setNodeListByType(layer, listType, list);
        }

        nextLayers[targetIndex] = layer;
        return nextLayers;
      });
      return;
    }

    if (event.detail === 2 && hit && hit.type === 'anchor') {
      setLayers((prevLayers) => {
        const targetIndex = activeIndexRef.current;
        if (!prevLayers[targetIndex]) {
          return prevLayers;
        }

        const nextLayers = [...prevLayers];
        const layer = cloneLayer(prevLayers[targetIndex]);

        const list = [...getNodeListByType(layer, hit.listType)];
        const nodeIndex = list.findIndex((node) => node.id === hit.nodeId);
        if (nodeIndex === -1) {
          return prevLayers;
        }

        const node = { ...list[nodeIndex], isCorner: !list[nodeIndex].isCorner };

        if (!node.isCorner) {
          const dx = node.x - node.cp1.x;
          const dy = node.y - node.cp1.y;
          const cp2Length = Math.hypot(node.cp2.x - node.x, node.cp2.y - node.y);
          const cp1Length = Math.hypot(dx, dy);

          if (cp1Length > 0) {
            node.cp2 = {
              x: node.x + (dx / cp1Length) * cp2Length,
              y: node.y + (dy / cp1Length) * cp2Length,
            };
          }
        }

        list[nodeIndex] = node;
        nextLayers[targetIndex] = setNodeListByType(layer, hit.listType, list);
        return nextLayers;
      });
      return;
    }

    if (hit && hit.type !== 'segment') {
      setIsDragging(true);
      setDragTarget(hit);
      dragPrevPosRef.current = { x, y };
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!showControlsRef.current) {
      return;
    }

    const { x, y } = getMousePos(event);

    if (isDragging && dragTarget) {
      const previous = dragPrevPosRef.current;
      dragPrevPosRef.current = { x, y };

      if (!previous) {
        return;
      }

      const factor = DRAG_SENSITIVITY_FACTOR[sensitivity];
      const dx = (x - previous.x) * factor;
      const dy = (y - previous.y) * factor;

      if (dx === 0 && dy === 0) {
        return;
      }

      setLayers((prevLayers) => {
        const targetIndex = activeIndexRef.current;
        if (!prevLayers[targetIndex]) {
          return prevLayers;
        }

        const nextLayers = [...prevLayers];
        let layer = cloneLayer(prevLayers[targetIndex]);

        const listType = dragTarget.listType;
        const list = [...getNodeListByType(layer, listType)];
        const nodeIndex = list.findIndex((node) => node.id === dragTarget.nodeId);

        if (nodeIndex === -1) {
          return prevLayers;
        }

        const node = { ...list[nodeIndex] };

        if (dragTarget.type === 'anchor') {
          node.x += dx;
          node.y += dy;
          node.cp1 = { x: node.cp1.x + dx, y: node.cp1.y + dy };
          node.cp2 = { x: node.cp2.x + dx, y: node.cp2.y + dy };
        }

        if (dragTarget.type === 'cp1') {
          node.cp1 = { x: node.cp1.x + dx, y: node.cp1.y + dy };

          if (!node.isCorner) {
            const x1 = node.cp1.x - node.x;
            const y1 = node.cp1.y - node.y;
            const cp2Length = Math.hypot(node.cp2.x - node.x, node.cp2.y - node.y);
            const cp1Length = Math.hypot(x1, y1);
            if (cp1Length > 0) {
              node.cp2 = {
                x: node.x - (x1 / cp1Length) * cp2Length,
                y: node.y - (y1 / cp1Length) * cp2Length,
              };
            }
          }
        }

        if (dragTarget.type === 'cp2') {
          node.cp2 = { x: node.cp2.x + dx, y: node.cp2.y + dy };

          if (!node.isCorner) {
            const x2 = node.cp2.x - node.x;
            const y2 = node.cp2.y - node.y;
            const cp1Length = Math.hypot(node.cp1.x - node.x, node.cp1.y - node.y);
            const cp2Length = Math.hypot(x2, y2);
            if (cp2Length > 0) {
              node.cp1 = {
                x: node.x - (x2 / cp2Length) * cp1Length,
                y: node.y - (y2 / cp2Length) * cp1Length,
              };
            }
          }
        }

        list[nodeIndex] = node;
        layer = setNodeListByType(layer, listType, list);

        if (dragTarget.type === 'anchor') {
          if (listType === 'ridge' && nodeIndex === list.length - 1) {
            layer = syncTip(layer, 'ridge');
          }
          if (listType === 'hollow' && nodeIndex === 0) {
            layer = syncTip(layer, 'hollow');
          }
        }

        nextLayers[targetIndex] = layer;
        return nextLayers;
      });
      return;
    }

    setHoveredTarget(getHitPoint(x, y));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
    dragPrevPosRef.current = null;
  };

  const handleLayerPropChange = (
    field: 'id' | 'color' | 'offsetY' | 'speed',
    value: string,
  ) => {
    setLayers((prevLayers) => {
      const targetIndex = activeIndexRef.current;
      if (!prevLayers[targetIndex]) {
        return prevLayers;
      }

      const nextLayers = [...prevLayers];
      const layer = cloneLayer(prevLayers[targetIndex]);

      if (field === 'id' || field === 'color') {
        layer[field] = value;
      } else {
        const numeric = Number.parseFloat(value);
        if (Number.isFinite(numeric)) {
          layer[field] = numeric;
        }
      }

      nextLayers[targetIndex] = layer;
      return nextLayers;
    });
  };

  const handleAddLayer = () => {
    setLayers((prevLayers) => {
      const newLayer = createBlankLayerAt(prevLayers.length);
      const nextLayers = [...prevLayers, newLayer];
      setActiveLayerIndex(nextLayers.length - 1);
      return nextLayers;
    });
  };

  const handleRemoveLayer = (targetIndex: number) => {
    setLayers((prevLayers) => {
      if (prevLayers.length <= 1) {
        return prevLayers;
      }

      const nextLayers = prevLayers.filter((_, index) => index !== targetIndex);
      setActiveLayerIndex((prevActive) => {
        if (prevActive === targetIndex) {
          return Math.max(0, targetIndex - 1);
        }
        if (prevActive > targetIndex) {
          return prevActive - 1;
        }
        return prevActive;
      });
      return nextLayers;
    });
  };

  const handleResetCurrentLayer = () => {
    setLayers((prevLayers) => {
      const targetIndex = activeIndexRef.current;
      const current = prevLayers[targetIndex];
      if (!current) {
        return prevLayers;
      }

      const nextLayers = [...prevLayers];
      const resetBase = createBlankLayerAt(targetIndex);
      nextLayers[targetIndex] = {
        ...resetBase,
        id: current.id,
        color: current.color,
        offsetY: current.offsetY,
        speed: current.speed,
      };
      return nextLayers;
    });
    setHoveredTarget(null);
    setDragTarget(null);
    setIsDragging(false);
    dragPrevPosRef.current = null;
  };

  const exportParams = async () => {
    const activeLayerId = layers[safeActiveLayerIndex]?.id ?? null;

    const payload = createWaveExportPayload({
      palette: WAVE_PALETTE,
      controlColors: CONTROL_COLORS,
      canvas: {
        widthPercent: canvasWidthPercent,
        heightPx: canvasHeightPx,
        showGrid,
      },
      animation: {
        playing: isPlaying,
        heaveAmplitudePx: DEFAULT_ANIMATION_SETTINGS.heaveAmplitudePx,
        timeScale: DEFAULT_ANIMATION_SETTINGS.timeScale,
      },
      editor: {
        showControls,
        sensitivity,
        activeLayerId,
      },
      layers,
    });

    const json = JSON.stringify(payload, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      setExportMessage('Scene JSON copied to clipboard.');
    } catch {
      console.info(json);
      setExportMessage('Clipboard unavailable. JSON printed to console.');
    }
  };

  const resetCanvas = () => {
    setCanvasWidthPercent(DEFAULT_CANVAS_SETTINGS.widthPercent);
    setCanvasHeightPx(DEFAULT_CANVAS_SETTINGS.heightPx);
  };

  const currentLayer = layers[safeActiveLayerIndex];
  if (!currentLayer) {
    return null;
  }

  return (
    <div className={`wave-editor-outer ${showControls ? 'with-sidebar' : ''}`}>
      <div
        className="wave-editor-container"
        style={{
          height: `${canvasHeightPx}px`,
          width: canvasWidthPercent === 100 ? '100%' : `${canvasWidthPercent}%`,
          margin: '0 auto',
        }}
      >
        <canvas
          ref={canvasRef}
          className="wave-editor-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: isDragging
              ? 'grabbing'
              : hoveredTarget
                ? hoveredTarget.type === 'segment'
                  ? 'crosshair'
                  : 'grab'
                : 'default',
          }}
        />

        {showControls && (
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
          </div>
        )}

        <button
          className="edit-toggle-btn"
          onClick={() => {
            const nextShowControls = !showControls;
            setShowControls(nextShowControls);
            if (!nextShowControls) {
              setIsDragging(false);
              setDragTarget(null);
              setHoveredTarget(null);
              dragPrevPosRef.current = null;
            }
          }}
        >
          {showControls ? 'Exit Editor' : 'Edit Waves'}
        </button>
      </div>

      {showControls && (
        <div className="wave-sidebar">
            <header className="sidebar-header">
              <h3>Wave Editor</h3>
              <button
                onClick={() => setIsPlaying((prev) => !prev)}
                className={`play-toggle ${!isPlaying ? 'paused' : ''}`}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </header>

            <section className="canvas-section">
              <div className="section-title">
                <span>Canvas Settings</span>
                <button className="icon-btn" onClick={resetCanvas} title="Reset Size">
                  Reset
                </button>
              </div>

              <div className="prop-group">
                <label>Width (%)</label>
                <div className="range-wrapper">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={canvasWidthPercent}
                    onChange={(event) =>
                      setCanvasWidthPercent(Number.parseInt(event.target.value, 10))
                    }
                  />
                  <span>{canvasWidthPercent}%</span>
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
                    value={canvasHeightPx}
                    onChange={(event) =>
                      setCanvasHeightPx(Number.parseInt(event.target.value, 10))
                    }
                  />
                  <span>{canvasHeightPx}px</span>
                </div>
              </div>

              <div className="prop-group">
                <label className="checkbox-wrapper" htmlFor="gridCheck">
                  <input
                    type="checkbox"
                    id="gridCheck"
                    checked={showGrid}
                    onChange={(event) => setShowGrid(event.target.checked)}
                  />
                  Show Grid
                </label>
              </div>
            </section>

            <section className="layer-section">
              <div className="section-title">
                <span>Layers</span>
                <button
                  className="icon-btn"
                  onClick={handleResetCurrentLayer}
                  title="Reset current layer shape"
                >
                  Reset Layer
                </button>
              </div>

              <div className="layer-list">
                {layers.map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`layer-item ${index === safeActiveLayerIndex ? 'active' : ''}`}
                    onClick={() => setActiveLayerIndex(index)}
                  >
                    <div
                      className="layer-color-preview"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="layer-name">{layer.id}</span>
                    <button
                      className="icon-btn delete-layer-item-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveLayer(index);
                      }}
                      title="Delete layer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="properties-section">
              <div className="section-title">Layer Properties</div>

              <div className="prop-group">
                <label>Name</label>
                <input
                  name="id"
                  value={currentLayer.id}
                  onChange={(event) => handleLayerPropChange('id', event.target.value)}
                />
              </div>

              <div className="prop-group">
                <label>Color</label>
                <div className="color-input-wrapper">
                  <input
                    name="color"
                    value={currentLayer.color}
                    onChange={(event) =>
                      handleLayerPropChange('color', event.target.value)
                    }
                  />
                  <input
                    type="color"
                    value={currentLayer.color}
                    onChange={(event) =>
                      handleLayerPropChange('color', event.target.value)
                    }
                  />
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
                    onChange={(event) =>
                      handleLayerPropChange('offsetY', event.target.value)
                    }
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
                    onChange={(event) =>
                      handleLayerPropChange('speed', event.target.value)
                    }
                  />
                  <span>{currentLayer.speed}x</span>
                </div>
              </div>

              <div className="prop-group">
                <label>Sensitivity</label>
                <button
                  className={`sens-btn ${sensitivity}`}
                  onClick={() =>
                    setSensitivity((prev) => (prev === 'normal' ? 'low' : 'normal'))
                  }
                >
                  {sensitivity === 'normal' ? 'Normal' : 'Fine'}
                </button>
              </div>
            </section>

            <section className="point-guide-section">
              <div className="section-title">Point Colors</div>
              <div className="point-color-guide">
                <div className="point-guide-item">
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: CONTROL_COLORS.ridgeAnchor }}
                  />
                  Ridge Anchor
                </div>
                <div className="point-guide-item">
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: CONTROL_COLORS.hollowAnchor }}
                  />
                  Hollow Anchor
                </div>
                <div className="point-guide-item">
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: CONTROL_COLORS.handle }}
                  />
                  Handle Point
                </div>
              </div>
            </section>

            <footer className="sidebar-footer">
              <button onClick={handleAddLayer} className="sidebar-add-btn">
                Add Layer
              </button>
              <button onClick={exportParams} className="json-btn">
                Export Scene JSON
              </button>
            </footer>

          {exportMessage && <div className="export-message">{exportMessage}</div>}
        </div>
      )}
      </div>
  );
};

export default GreatWave;
