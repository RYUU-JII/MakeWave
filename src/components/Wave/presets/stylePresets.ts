import type { WaveLayer } from '../waveTypes';

export type StylePreset = 'claw-crest' | 'spray-fractal' | 'undertow-band';

interface TexturePresetValues {
  foamIntensity: number;
  foamScale: number;
  stripeStrength: number;
  stripeSpacing: number;
}

const STYLE_PRESET_VALUES: Record<StylePreset, TexturePresetValues> = {
  'claw-crest': {
    foamIntensity: 0.92,
    foamScale: 1.3,
    stripeStrength: 0.48,
    stripeSpacing: 0.07,
  },
  'spray-fractal': {
    foamIntensity: 1,
    foamScale: 1.65,
    stripeStrength: 0.18,
    stripeSpacing: 0.12,
  },
  'undertow-band': {
    foamIntensity: 0.35,
    foamScale: 0.85,
    stripeStrength: 0.62,
    stripeSpacing: 0.055,
  },
};

export const applyStylePresetToLayer = (layer: WaveLayer, preset: StylePreset): WaveLayer => ({
  ...layer,
  ...STYLE_PRESET_VALUES[preset],
});
