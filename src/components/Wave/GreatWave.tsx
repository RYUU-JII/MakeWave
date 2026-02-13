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
} from './waveDefaults';
import { getDistToCubicBezier, splitCubicBezier } from './waveGeometry';
import { createWaveExportPayload } from './waveExport';
import {
  WS_MARGIN,
  clamp01,
  drawCompositionGuides,
  drawGrid,
  drawLayerPath,
  drawRibTextures,
  getHeave,
  getX,
  getY,
  work,
} from './rendering/waveCanvas';
import type {
  HitTarget,
  LayerPropField,
  NodeListType,
  WaveNode,
} from './waveTypes';
import { useWaveEditor } from './hooks/useWaveEditor';
import { WaveSidebar } from './components/Sidebar/WaveSidebar';
import { ShortcutLegend } from './components/ShortcutLegend';
import { createNodeId, getNodeListByType, setNodeListByType, syncTip } from './editor/layerEditing';
import { applyStylePresetToLayer } from './presets/stylePresets';
import type { StylePreset } from './presets/stylePresets';

const GreatWave: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    layers, setLayers,
    activeLayerIndex, setActiveLayerIndex,
    safeActiveLayerIndex, currentLayer,
    canvasWidthPx, setCanvasWidthPx,
    canvasHeightPx, setCanvasHeightPx,
    showControls, setShowControls,
    showGrid, setShowGrid,
    hoveredTarget, setHoveredTarget,
    isDragging, setIsDragging,
    dragTarget, setDragTarget,
    isPlaying, setIsPlaying,
    sensitivity, setSensitivity,
    exportMessage, setExportMessage,
    refImage, refImageElemRef,
    undo, redo, pushToHistory,
    handleImageUpload, handleUpdateRefImage, handleClearRefImage
  } = useWaveEditor();

  const [showThirdsGuide, setShowThirdsGuide] = useState(true);
  const [showHorizonGuide, setShowHorizonGuide] = useState(false);
  const [horizonGuideY, setHorizonGuideY] = useState(0.36);

  const layersRef = useRef(layers);
  const activeIndexRef = useRef(activeLayerIndex);
  const showControlsRef = useRef(showControls);
  const showGridRef = useRef(showGrid);
  const showThirdsGuideRef = useRef(showThirdsGuide);
  const showHorizonGuideRef = useRef(showHorizonGuide);
  const horizonGuideYRef = useRef(horizonGuideY);
  const hoveredTargetRef = useRef<HitTarget | null>(hoveredTarget);
  const isPlayingRef = useRef(isPlaying);
  const totalElapsedRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const dragPrevPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { layersRef.current = layers; }, [layers]);
  useEffect(() => { activeIndexRef.current = safeActiveLayerIndex; }, [safeActiveLayerIndex]);
  useEffect(() => { showControlsRef.current = showControls; }, [showControls]);
  useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);
  useEffect(() => { showThirdsGuideRef.current = showThirdsGuide; }, [showThirdsGuide]);
  useEffect(() => { showHorizonGuideRef.current = showHorizonGuide; }, [showHorizonGuide]);
  useEffect(() => { horizonGuideYRef.current = horizonGuideY; }, [horizonGuideY]);
  useEffect(() => { hoveredTargetRef.current = hoveredTarget; }, [hoveredTarget]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    if (!exportMessage) return;
    const timer = window.setTimeout(() => setExportMessage(''), 2000);
    return () => window.clearTimeout(timer);
  }, [exportMessage, setExportMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const getMousePos = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - WS_MARGIN);
    const y = (event.clientY - rect.top - WS_MARGIN);
    return {
      x: x / (rect.width - 2 * WS_MARGIN),
      y: y / (rect.height - 2 * WS_MARGIN)
    };
  };

  const getHitPoint = (mx: number, my: number): HitTarget | null => {
    const layer = layersRef.current[activeIndexRef.current];
    if (!layer) return null;

    const findInList = (nodes: WaveNode[], listType: NodeListType): HitTarget | null => {
      for (const node of nodes) {
        if (Math.hypot(mx - node.x, my - node.y) < HIT_RADIUS) return { nodeId: node.id, type: 'anchor', listType };
        if (Math.hypot(mx - node.cp1.x, my - node.cp1.y) < HIT_RADIUS) return { nodeId: node.id, type: 'cp1', listType };
        if (Math.hypot(mx - node.cp2.x, my - node.cp2.y) < HIT_RADIUS) return { nodeId: node.id, type: 'cp2', listType };
      }
      for (let i = 0; i < nodes.length - 1; i++) {
        const d = getDistToCubicBezier({ x: mx, y: my }, nodes[i], nodes[i].cp2, nodes[i + 1].cp1, nodes[i + 1]);
        if (d.dist < SEGMENT_HIT_RADIUS) return { type: 'segment', listType, idx: i, t: d.t };
      }
      return null;
    };

    return findInList(layer.ridgeNodes, 'ridge') || findInList(layer.hollowNodes, 'hollow');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = time;
      const delta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;
      if (isPlayingRef.current) totalElapsedRef.current += delta;

      const logicalWidth = canvas.width / window.devicePixelRatio;
      const logicalHeight = canvas.height / window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      ctx.fillStyle = WAVE_PALETTE.paper;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Draw Reference Image
      if (refImage?.visible && refImageElemRef.current) {
        ctx.save();
        ctx.globalAlpha = refImage.opacity;
        ctx.drawImage(refImageElemRef.current, WS_MARGIN, WS_MARGIN, work(logicalWidth), work(logicalHeight));
        ctx.restore();
      }

      if (showControlsRef.current && showGridRef.current) drawGrid(ctx, logicalWidth, logicalHeight);

      if (showControlsRef.current) {
        drawCompositionGuides(
          ctx,
          logicalWidth,
          logicalHeight,
          showThirdsGuideRef.current,
          showHorizonGuideRef.current,
          horizonGuideYRef.current,
        );
      }

      const currentLayers = layersRef.current;
      const activeIdx = activeIndexRef.current;
      const hovered = hoveredTargetRef.current;

      ctx.save();
      ctx.beginPath();
      ctx.rect(WS_MARGIN, WS_MARGIN, work(logicalWidth), work(logicalHeight));
      ctx.clip();

      currentLayers.forEach((layer, idx) => {
        const isActive = idx === activeIdx;
        ctx.globalAlpha = (showControlsRef.current ? (isActive ? 1 : 0.2) : 1) * layer.opacity;
        const heave = getHeave(totalElapsedRef.current, layer.speed);
        const offsetY = layer.offsetY;
        const pathReady = drawLayerPath(ctx, layer, logicalWidth, logicalHeight, offsetY, heave);
        if (!pathReady) return;
        ctx.fillStyle = layer.color;
        ctx.fill();

        ctx.save();
        drawLayerPath(ctx, layer, logicalWidth, logicalHeight, offsetY, heave);
        ctx.clip();
        drawRibTextures(ctx, layer, logicalWidth, logicalHeight, totalElapsedRef.current);
        ctx.restore();
      });
      ctx.restore();

      const activeLayer = currentLayers[activeIdx];
      if (showControlsRef.current && activeLayer) {
        ctx.globalAlpha = 1;
        const heave = getHeave(totalElapsedRef.current, activeLayer.speed);
        const offsetY = activeLayer.offsetY;

        const drawNodeControls = (node: WaveNode, color: string, skip1 = false, skip2 = false) => {
          const ax = getX(node.x, logicalWidth), ay = getY(node.y, logicalHeight, offsetY, heave);
          const c1x = getX(node.cp1.x, logicalWidth), c1y = getY(node.cp1.y, logicalHeight, offsetY, heave);
          const c2x = getX(node.cp2.x, logicalWidth), c2y = getY(node.cp2.y, logicalHeight, offsetY, heave);
          ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
          ctx.beginPath();
          if (!skip1) { ctx.moveTo(c1x, c1y); ctx.lineTo(ax, ay); } else ctx.moveTo(ax, ay);
          if (!skip2) ctx.lineTo(c2x, c2y); ctx.stroke(); ctx.setLineDash([]);
          const isH = hovered?.type !== 'segment' && hovered?.nodeId === node.id && hovered.type === 'anchor';
          ctx.fillStyle = isH ? CONTROL_COLORS.hover : color;
          ctx.beginPath();
          if (node.isCorner) ctx.rect(ax - 6, ay - 6, 12, 12); else ctx.arc(ax, ay, 6, 0, Math.PI * 2);
          ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
          if (!skip1) {
            const h = hovered?.type === 'cp1' && hovered.nodeId === node.id;
            ctx.fillStyle = h ? CONTROL_COLORS.hover : CONTROL_COLORS.handle;
            ctx.beginPath(); ctx.arc(c1x, c1y, 4, 0, Math.PI * 2); ctx.fill();
          }
          if (!skip2) {
            const h = hovered?.type === 'cp2' && hovered.nodeId === node.id;
            ctx.fillStyle = h ? CONTROL_COLORS.hover : CONTROL_COLORS.handle;
            ctx.beginPath(); ctx.arc(c2x, c2y, 4, 0, Math.PI * 2); ctx.fill();
          }
        };
        activeLayer.hollowNodes.forEach((n, i) => drawNodeControls(n, CONTROL_COLORS.hollowAnchor, i === 0, false));
        activeLayer.ridgeNodes.forEach((n, i) => drawNodeControls(n, CONTROL_COLORS.ridgeAnchor, false, i === activeLayer.ridgeNodes.length - 1));
      }
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frameId); resizeObserver.disconnect(); };
  }, [refImage, refImageElemRef]);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!showControlsRef.current) return;
    const { x, y } = getMousePos(event);
    const hit = getHitPoint(x, y);

    if (event.altKey && hit) {
      pushToHistory();
      setLayers((prev) => {
        const idx = activeIndexRef.current;
        if (!prev[idx]) return prev;
        const nextLayers = [...prev];
        let layer = cloneLayer(prev[idx]);
        const list = [...getNodeListByType(layer, hit.listType)];
        if (hit.type === 'anchor') {
          const nIdx = list.findIndex(n => n.id === hit.nodeId);
          if (nIdx === -1 || list.length <= 2 || (hit.listType === 'ridge' && nIdx === 0) || (hit.listType === 'hollow' && nIdx === list.length - 1)) return prev;
          const wasTail = nIdx === list.length - 1, wasHead = nIdx === 0;
          list.splice(nIdx, 1);
          layer = setNodeListByType(layer, hit.listType, list);
          if (hit.listType === 'ridge' && wasTail) layer = syncTip(layer, 'ridge');
          if (hit.listType === 'hollow' && wasHead) layer = syncTip(layer, 'hollow');
        } else if (hit.type === 'segment') {
          const sIdx = hit.idx;
          const [lS, rS] = splitCubicBezier(list[sIdx], list[sIdx].cp2, list[sIdx + 1].cp1, list[sIdx + 1], hit.t);
          const ins: WaveNode = { id: createNodeId(), x: lS[3].x, y: lS[3].y, cp1: lS[2], cp2: rS[1], isCorner: false };
          list[sIdx] = { ...list[sIdx], cp2: lS[1] };
          list.splice(sIdx + 1, 0, ins);
          list[sIdx + 2] = { ...list[sIdx + 2], cp1: rS[2] };
          layer = setNodeListByType(layer, hit.listType, list);
        }
        nextLayers[idx] = layer;
        return nextLayers;
      });
      return;
    }

    if (event.detail === 2 && hit && hit.type === 'anchor') {
      pushToHistory();
      setLayers((prev) => {
        const idx = activeIndexRef.current;
        const nextLayers = [...prev];
        const layer = cloneLayer(prev[idx]);
        const list = [...getNodeListByType(layer, hit.listType)];
        const nIdx = list.findIndex(n => n.id === hit.nodeId);
        if (nIdx === -1) return prev;
        const node = { ...list[nIdx], isCorner: !list[nIdx].isCorner };
        if (!node.isCorner) {
          const dx = node.x - node.cp1.x, dy = node.y - node.cp1.y;
          const cp2L = Math.hypot(node.cp2.x - node.x, node.cp2.y - node.y), cp1L = Math.hypot(dx, dy);
          if (cp1L > 0) node.cp2 = { x: node.x + (dx / cp1L) * cp2L, y: node.y + (dy / cp1L) * cp2L };
        }
        list[nIdx] = node;
        nextLayers[idx] = setNodeListByType(layer, hit.listType, list);
        return nextLayers;
      });
      return;
    }

    if (hit && hit.type !== 'segment') {
      pushToHistory();
      setIsDragging(true);
      setDragTarget(hit);
      dragPrevPosRef.current = { x, y };
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!showControlsRef.current) return;
    const { x, y } = getMousePos(event);
    if (isDragging && dragTarget) {
      const prev = dragPrevPosRef.current;
      dragPrevPosRef.current = { x, y };
      if (!prev) return;
      const dx = (x - prev.x) * DRAG_SENSITIVITY_FACTOR[sensitivity];
      const dy = (y - prev.y) * DRAG_SENSITIVITY_FACTOR[sensitivity];
      if (dx === 0 && dy === 0) return;
      setLayers((prevLayers) => {
        const idx = activeIndexRef.current;
        const nextLayers = [...prevLayers];
        let layer = cloneLayer(prevLayers[idx]);
        const list = [...getNodeListByType(layer, dragTarget.listType)];
        const nIdx = list.findIndex(n => n.id === dragTarget.nodeId);
        if (nIdx === -1) return prevLayers;
        const node = { ...list[nIdx] };
        if (dragTarget.type === 'anchor') {
          const ox = node.x, oy = node.y;
          node.x = clamp01(node.x + dx); node.y = clamp01(node.y + dy);
          const adx = node.x - ox, ady = node.y - oy;
          node.cp1 = { x: node.cp1.x + adx, y: node.cp1.y + ady };
          node.cp2 = { x: node.cp2.x + adx, y: node.cp2.y + ady };
        } else if (dragTarget.type === 'cp1') {
          node.cp1 = { x: node.cp1.x + dx, y: node.cp1.y + dy };
          if (!node.isCorner) {
            const x1 = node.cp1.x - node.x, y1 = node.cp1.y - node.y;
            const cp2L = Math.hypot(node.cp2.x - node.x, node.cp2.y - node.y), cp1L = Math.hypot(x1, y1);
            if (cp1L > 0) node.cp2 = { x: node.x - (x1 / cp1L) * cp2L, y: node.y - (y1 / cp1L) * cp2L };
          }
        } else if (dragTarget.type === 'cp2') {
          node.cp2 = { x: node.cp2.x + dx, y: node.cp2.y + dy };
          if (!node.isCorner) {
            const x2 = node.cp2.x - node.x, y2 = node.cp2.y - node.y;
            const cp1L = Math.hypot(node.cp1.x - node.x, node.cp1.y - node.y), cp2L = Math.hypot(x2, y2);
            if (cp2L > 0) node.cp1 = { x: node.x - (x2 / cp2L) * cp1L, y: node.y - (y2 / cp2L) * cp1L };
          }
        }
        list[nIdx] = node; layer = setNodeListByType(layer, dragTarget.listType, list);
        if (dragTarget.type === 'anchor') {
          if (dragTarget.listType === 'ridge' && nIdx === list.length - 1) layer = syncTip(layer, 'ridge');
          if (dragTarget.listType === 'hollow' && nIdx === 0) layer = syncTip(layer, 'hollow');
        }
        nextLayers[idx] = layer; return nextLayers;
      });
    } else setHoveredTarget(getHitPoint(x, y));
  };

  const handleMouseUp = () => { setIsDragging(false); setDragTarget(null); dragPrevPosRef.current = null; };

  const handleLayerPropChange = (field: LayerPropField, value: string) => {
    pushToHistory();
    setLayers((prev) => {
      const idx = activeIndexRef.current;
      const nextLayers = [...prev];
      const layer = cloneLayer(prev[idx]);
      if (field === 'id' || field === 'color') {
        layer[field] = value;
      } else {
        const num = parseFloat(value);
        if (Number.isFinite(num)) layer[field] = num;
      }
      nextLayers[idx] = layer; return nextLayers;
    });
  };

  const handleAddLayer = () => {
    pushToHistory();
    setLayers((prev) => {
      const nextLayers = [...prev, createBlankLayerAt(prev.length)];
      setActiveLayerIndex(nextLayers.length - 1);
      return nextLayers;
    });
  };

  const handleRemoveLayer = (idx: number) => {
    pushToHistory();
    setLayers((prev) => {
      if (prev.length <= 1) return prev;
      const nextLayers = prev.filter((_, i) => i !== idx);
      setActiveLayerIndex(pa => pa === idx ? Math.max(0, idx - 1) : (pa > idx ? pa - 1 : pa));
      return nextLayers;
    });
  };

  const handleResetCurrentLayer = () => {
    pushToHistory();
    setLayers((prev) => {
      const idx = activeIndexRef.current, cur = prev[idx];
      if (!cur) return prev;
      const nextLayers = [...prev];
      const res = createBlankLayerAt(idx);
      nextLayers[idx] = {
        ...res,
        id: cur.id,
        color: cur.color,
        opacity: cur.opacity,
        offsetY: cur.offsetY,
        speed: cur.speed,
        foamIntensity: cur.foamIntensity,
        foamScale: cur.foamScale,
        stripeStrength: cur.stripeStrength,
        stripeSpacing: cur.stripeSpacing,
      };
      return nextLayers;
    });
    setHoveredTarget(null); setDragTarget(null); setIsDragging(false);
  };

  const handleApplyStylePreset = (preset: StylePreset) => {
    pushToHistory();
    setLayers((prev) => {
      const idx = activeIndexRef.current;
      if (!prev[idx]) return prev;
      const next = [...prev];
      const layer = cloneLayer(prev[idx]);
      next[idx] = applyStylePresetToLayer(layer, preset);
      return next;
    });
  };

  const handleExport = async () => {
    const payload = createWaveExportPayload({
      palette: WAVE_PALETTE, controlColors: CONTROL_COLORS,
      canvas: { widthPx: canvasWidthPx, heightPx: canvasHeightPx, showGrid },
      animation: { playing: isPlaying, heaveAmplitudePx: DEFAULT_ANIMATION_SETTINGS.heaveAmplitudePx, timeScale: DEFAULT_ANIMATION_SETTINGS.timeScale },
      editor: { showControls, sensitivity, activeLayerId: layers[safeActiveLayerIndex]?.id || null },
      layers,
    });
    const json = JSON.stringify(payload, null, 2);
    try { await navigator.clipboard.writeText(json); setExportMessage('Copied to clipboard.'); } catch { setExportMessage('Print console.'); }
  };

  if (!currentLayer) return null;

  return (
    <div className={`wave-editor-outer ${showControls ? 'with-sidebar' : ''}`}>
      <div className="wave-editor-container" style={{ width: `${canvasWidthPx + 2 * WS_MARGIN}px`, height: `${canvasHeightPx + 2 * WS_MARGIN}px`, margin: '0 auto' }}>
        <canvas ref={canvasRef} className="wave-editor-canvas" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: isDragging ? 'grabbing' : (hoveredTarget ? (hoveredTarget.type === 'segment' ? 'crosshair' : 'grab') : 'default') }} />
        {showControls && <ShortcutLegend />}
        <button className="edit-toggle-btn" onClick={() => setShowControls(!showControls)}>{showControls ? 'Exit Editor' : 'Edit Waves'}</button>
      </div>

      {showControls && (
        <>
          <WaveSidebar
            side="left"
            layers={layers} activeLayerIndex={safeActiveLayerIndex}
            canvasWidthPx={canvasWidthPx} canvasHeightPx={canvasHeightPx}
            showGrid={showGrid} sensitivity={sensitivity} isPlaying={isPlaying}
            exportMessage={exportMessage}
            showThirdsGuide={showThirdsGuide}
            showHorizonGuide={showHorizonGuide}
            horizonGuideY={horizonGuideY}
            onThirdsGuideToggle={setShowThirdsGuide}
            onHorizonGuideToggle={setShowHorizonGuide}
            onHorizonGuideYChange={setHorizonGuideY}
            onSelectLayer={setActiveLayerIndex}
            onAddLayer={handleAddLayer}
            onRemoveLayer={handleRemoveLayer}
            onResetLayer={handleResetCurrentLayer}
            onLayerPropChange={handleLayerPropChange}
            onApplyStylePreset={handleApplyStylePreset}
            onSensitivityToggle={() => setSensitivity(s => s === 'normal' ? 'low' : 'normal')}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onCanvasWidthChange={setCanvasWidthPx}
            onCanvasHeightChange={setCanvasHeightPx}
            onGridToggle={setShowGrid}
            onCanvasReset={() => { setCanvasWidthPx(DEFAULT_CANVAS_SETTINGS.widthPx); setCanvasHeightPx(DEFAULT_CANVAS_SETTINGS.heightPx); }}
            onExport={handleExport}
            referenceImage={refImage}
            onImageUpload={handleImageUpload}
            onUpdateImage={handleUpdateRefImage}
            onClearImage={handleClearRefImage}
          />
          <WaveSidebar
            side="right"
            layers={layers} activeLayerIndex={safeActiveLayerIndex}
            canvasWidthPx={canvasWidthPx} canvasHeightPx={canvasHeightPx}
            showGrid={showGrid} sensitivity={sensitivity} isPlaying={isPlaying}
            exportMessage={exportMessage}
            showThirdsGuide={showThirdsGuide}
            showHorizonGuide={showHorizonGuide}
            horizonGuideY={horizonGuideY}
            onThirdsGuideToggle={setShowThirdsGuide}
            onHorizonGuideToggle={setShowHorizonGuide}
            onHorizonGuideYChange={setHorizonGuideY}
            onSelectLayer={setActiveLayerIndex}
            onAddLayer={handleAddLayer}
            onRemoveLayer={handleRemoveLayer}
            onResetLayer={handleResetCurrentLayer}
            onLayerPropChange={handleLayerPropChange}
            onApplyStylePreset={handleApplyStylePreset}
            onSensitivityToggle={() => setSensitivity(s => s === 'normal' ? 'low' : 'normal')}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onCanvasWidthChange={setCanvasWidthPx}
            onCanvasHeightChange={setCanvasHeightPx}
            onGridToggle={setShowGrid}
            onCanvasReset={() => { setCanvasWidthPx(DEFAULT_CANVAS_SETTINGS.widthPx); setCanvasHeightPx(DEFAULT_CANVAS_SETTINGS.heightPx); }}
            onExport={handleExport}
            referenceImage={refImage}
            onImageUpload={handleImageUpload}
            onUpdateImage={handleUpdateRefImage}
            onClearImage={handleClearRefImage}
          />
        </>
      )}
    </div>
  );
};

export default GreatWave;
