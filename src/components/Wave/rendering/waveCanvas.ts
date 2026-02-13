import { DEFAULT_ANIMATION_SETTINGS } from '../waveDefaults';
import type { WaveLayer } from '../waveTypes';

export const WS_MARGIN = 70;

export const work = (total: number): number => Math.max(1, total - 2 * WS_MARGIN);

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export const getX = (x: number, width: number): number =>
  Math.round(WS_MARGIN + x * work(width));

export const getY = (
  y: number,
  height: number,
  offsetY: number,
  heave: number,
): number => Math.round(WS_MARGIN + y * work(height) + offsetY + heave);

export const getHeave = (elapsedMs: number, speed: number): number => {
  const t = elapsedMs * DEFAULT_ANIMATION_SETTINGS.timeScale * speed;
  return Math.sin(t) * DEFAULT_ANIMATION_SETTINGS.heaveAmplitudePx;
};

export const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 1;
  const w = work(width);
  const h = work(height);
  const step = 50;
  ctx.beginPath();
  for (let x = 0; x <= w; x += step) {
    ctx.moveTo(WS_MARGIN + x, WS_MARGIN);
    ctx.lineTo(WS_MARGIN + x, WS_MARGIN + h);
  }
  for (let y = 0; y <= h; y += step) {
    ctx.moveTo(WS_MARGIN, WS_MARGIN + y);
    ctx.lineTo(WS_MARGIN + w, WS_MARGIN + y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(WS_MARGIN, WS_MARGIN, w, h);
  ctx.restore();
};

export const drawCompositionGuides = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  showThirdsGuide: boolean,
  showHorizonGuide: boolean,
  horizonGuideY: number,
) => {
  if (showThirdsGuide) {
    const w = work(width);
    const h = work(height);
    ctx.save();
    ctx.strokeStyle = 'rgba(161, 101, 47, 0.35)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(WS_MARGIN + w / 3, WS_MARGIN);
    ctx.lineTo(WS_MARGIN + w / 3, WS_MARGIN + h);
    ctx.moveTo(WS_MARGIN + (w * 2) / 3, WS_MARGIN);
    ctx.lineTo(WS_MARGIN + (w * 2) / 3, WS_MARGIN + h);
    ctx.moveTo(WS_MARGIN, WS_MARGIN + h / 3);
    ctx.lineTo(WS_MARGIN + w, WS_MARGIN + h / 3);
    ctx.moveTo(WS_MARGIN, WS_MARGIN + (h * 2) / 3);
    ctx.lineTo(WS_MARGIN + w, WS_MARGIN + (h * 2) / 3);
    ctx.stroke();
    ctx.restore();
  }

  if (showHorizonGuide) {
    const y = WS_MARGIN + horizonGuideY * work(height);
    ctx.save();
    ctx.strokeStyle = 'rgba(23, 48, 78, 0.55)';
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(WS_MARGIN, y);
    ctx.lineTo(WS_MARGIN + work(width), y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(23, 48, 78, 0.75)';
    ctx.font = '11px sans-serif';
    ctx.fillText('Horizon', WS_MARGIN + 8, y - 8);
    ctx.restore();
  }
};

export const drawLayerPath = (
  ctx: CanvasRenderingContext2D,
  layer: WaveLayer,
  width: number,
  height: number,
  offsetY: number,
  heave: number,
): boolean => {
  const ridgeStart = layer.ridgeNodes[0];
  if (!ridgeStart) return false;

  ctx.beginPath();
  ctx.moveTo(getX(0, width), height);
  ctx.lineTo(getX(0, width), getY(ridgeStart.y, height, offsetY, heave));
  ctx.lineTo(getX(ridgeStart.x, width), getY(ridgeStart.y, height, offsetY, heave));

  for (let i = 0; i < layer.ridgeNodes.length - 1; i++) {
    const c = layer.ridgeNodes[i];
    const n = layer.ridgeNodes[i + 1];
    ctx.bezierCurveTo(
      getX(c.cp2.x, width), getY(c.cp2.y, height, offsetY, heave),
      getX(n.cp1.x, width), getY(n.cp1.y, height, offsetY, heave),
      getX(n.x, width), getY(n.y, height, offsetY, heave),
    );
  }

  for (let i = 0; i < layer.hollowNodes.length - 1; i++) {
    const c = layer.hollowNodes[i];
    const n = layer.hollowNodes[i + 1];
    ctx.bezierCurveTo(
      getX(c.cp2.x, width), getY(c.cp2.y, height, offsetY, heave),
      getX(n.cp1.x, width), getY(n.cp1.y, height, offsetY, heave),
      getX(n.x, width), getY(n.y, height, offsetY, heave),
    );
  }

  const hollowEnd = layer.hollowNodes[layer.hollowNodes.length - 1];
  if (hollowEnd) ctx.lineTo(getX(1, width), getY(hollowEnd.y, height, offsetY, heave));
  ctx.lineTo(getX(1, width), height);
  ctx.closePath();
  return true;
};

const fract = (v: number): number => v - Math.floor(v);

const ribNoise = (x: number, y: number): number => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return fract(n);
};

const fbmFoam = (x: number, y: number): number => {
  let value = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    value += ribNoise(x * freq, y * freq) * amp;
    freq *= 2.03;
    amp *= 0.5;
  }
  return value;
};

export const drawRibTextures = (
  ctx: CanvasRenderingContext2D,
  layer: WaveLayer,
  width: number,
  height: number,
  elapsedMs: number,
) => {
  const textureW = Math.max(1, Math.round(work(width)));
  const textureH = Math.max(1, Math.round(work(height)));
  const data = ctx.createImageData(textureW, textureH);
  const px = data.data;

  const foamBias = 0.56 - layer.foamIntensity * 0.18;
  const stripeFreq = Math.max(3, 1 / Math.max(0.025, layer.stripeSpacing));
  const travel = elapsedMs * 0.00023 * layer.speed;

  for (let y = 0; y < textureH; y++) {
    const ny = y / textureH;
    for (let x = 0; x < textureW; x++) {
      const nx = x / textureW;
      const i = (y * textureW + x) * 4;

      const foam = fbmFoam(nx * 4.5 * layer.foamScale + travel, ny * 4.5 * layer.foamScale - travel * 0.6);
      const foamMask = Math.max(0, (foam - foamBias) / Math.max(0.0001, 1 - foamBias));
      const stripePhase = nx * stripeFreq + Math.sin((ny + travel) * 11.5) * 0.08;
      const stripe = Math.pow(1 - Math.abs(Math.sin(stripePhase * Math.PI)), 5);

      const foamAlpha = Math.round(foamMask * layer.foamIntensity * 205);
      const stripeAlpha = Math.round(stripe * layer.stripeStrength * 120);
      const a = Math.max(foamAlpha, stripeAlpha);

      px[i] = 248;
      px[i + 1] = 251;
      px[i + 2] = 255;
      px[i + 3] = Math.min(255, a);
    }
  }

  ctx.putImageData(data, WS_MARGIN, WS_MARGIN);
};
