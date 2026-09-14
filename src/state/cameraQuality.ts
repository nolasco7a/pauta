import { CommonResolutions } from 'react-native-vision-camera';
import type { Size } from 'react-native-vision-camera';

export type CameraQuality = 'saver' | 'balanced' | 'max';

export const CAMERA_QUALITY_PRESETS: Record<
  CameraQuality,
  { resolution: Size; bitRate: number; mbPerMinute: number }
> = {
  // ponytail: bitRate en bits/seg, valores estandar de la industria para cada resolucion.
  saver: { resolution: CommonResolutions.HD_16_9, bitRate: 4_000_000, mbPerMinute: 30 },
  balanced: { resolution: CommonResolutions.FHD_16_9, bitRate: 8_000_000, mbPerMinute: 60 },
  max: { resolution: CommonResolutions.UHD_16_9, bitRate: 25_000_000, mbPerMinute: 188 },
};
