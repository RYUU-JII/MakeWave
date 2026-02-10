import type { ControlPoint } from './waveTypes';

export type CubicSegment = [ControlPoint, ControlPoint, ControlPoint, ControlPoint];

export const evaluateCubicBezier = (
  t: number,
  p0: ControlPoint,
  cp1: ControlPoint,
  cp2: ControlPoint,
  p3: ControlPoint,
): ControlPoint => {
  const mt = 1 - t;
  return {
    x:
      mt * mt * mt * p0.x +
      3 * mt * mt * t * cp1.x +
      3 * mt * t * t * cp2.x +
      t * t * t * p3.x,
    y:
      mt * mt * mt * p0.y +
      3 * mt * mt * t * cp1.y +
      3 * mt * t * t * cp2.y +
      t * t * t * p3.y,
  };
};

export const splitCubicBezier = (
  p0: ControlPoint,
  cp1: ControlPoint,
  cp2: ControlPoint,
  p3: ControlPoint,
  t: number,
): [CubicSegment, CubicSegment] => {
  const x1 = p0.x + (cp1.x - p0.x) * t;
  const y1 = p0.y + (cp1.y - p0.y) * t;
  const x2 = cp1.x + (cp2.x - cp1.x) * t;
  const y2 = cp1.y + (cp2.y - cp1.y) * t;
  const x3 = cp2.x + (p3.x - cp2.x) * t;
  const y3 = cp2.y + (p3.y - cp2.y) * t;
  const x12 = x1 + (x2 - x1) * t;
  const y12 = y1 + (y2 - y1) * t;
  const x23 = x2 + (x3 - x2) * t;
  const y23 = y2 + (y3 - y2) * t;
  const x123 = x12 + (x23 - x12) * t;
  const y123 = y12 + (y23 - y12) * t;

  return [
    [
      { x: p0.x, y: p0.y },
      { x: x1, y: y1 },
      { x: x12, y: y12 },
      { x: x123, y: y123 },
    ],
    [
      { x: x123, y: y123 },
      { x: x23, y: y23 },
      { x: x3, y: y3 },
      { x: p3.x, y: p3.y },
    ],
  ];
};

export const getDistToCubicBezier = (
  point: ControlPoint,
  p0: ControlPoint,
  cp1: ControlPoint,
  cp2: ControlPoint,
  p3: ControlPoint,
  samples = 24,
): { dist: number; t: number } => {
  let minDistSq = Number.POSITIVE_INFINITY;
  let bestT = 0;

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const position = evaluateCubicBezier(t, p0, cp1, cp2, p3);
    const dx = point.x - position.x;
    const dy = point.y - position.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistSq) {
      minDistSq = distSq;
      bestT = t;
    }
  }

  return {
    dist: Math.sqrt(minDistSq),
    t: bestT,
  };
};
