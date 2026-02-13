import type { NodeListType, WaveLayer, WaveNode } from '../waveTypes';

export const getNodeListByType = (layer: WaveLayer, listType: NodeListType): WaveNode[] =>
  (listType === 'ridge' ? layer.ridgeNodes : layer.hollowNodes);

export const setNodeListByType = (layer: WaveLayer, listType: NodeListType, nodes: WaveNode[]): WaveLayer => {
  if (listType === 'ridge') return { ...layer, ridgeNodes: nodes };
  return { ...layer, hollowNodes: nodes };
};

export const syncTip = (layer: WaveLayer, sourceList: NodeListType): WaveLayer => {
  if (layer.ridgeNodes.length === 0 || layer.hollowNodes.length === 0) return layer;
  const ridgeTipIndex = layer.ridgeNodes.length - 1;
  const ridgeTip = layer.ridgeNodes[ridgeTipIndex];
  const hollowTip = layer.hollowNodes[0];

  if (sourceList === 'ridge') {
    const dx = ridgeTip.x - hollowTip.x;
    const dy = ridgeTip.y - hollowTip.y;
    const nextHollow = [...layer.hollowNodes];
    nextHollow[0] = {
      ...hollowTip,
      x: ridgeTip.x,
      y: ridgeTip.y,
      cp1: { x: hollowTip.cp1.x + dx, y: hollowTip.cp1.y + dy },
      cp2: { x: hollowTip.cp2.x + dx, y: hollowTip.cp2.y + dy },
    };
    return { ...layer, hollowNodes: nextHollow };
  }

  const dx = hollowTip.x - ridgeTip.x;
  const dy = hollowTip.y - ridgeTip.y;
  const nextRidge = [...layer.ridgeNodes];
  nextRidge[ridgeTipIndex] = {
    ...ridgeTip,
    x: hollowTip.x,
    y: hollowTip.y,
    cp1: { x: ridgeTip.cp1.x + dx, y: ridgeTip.cp1.y + dy },
    cp2: { x: ridgeTip.cp2.x + dx, y: ridgeTip.cp2.y + dy },
  };
  return { ...layer, ridgeNodes: nextRidge };
};

export const createNodeId = (): string => `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
