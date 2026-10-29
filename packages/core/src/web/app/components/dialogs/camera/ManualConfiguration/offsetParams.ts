import type {
  FisheyeCameraParametersV2,
  FisheyeCameraParametersV3,
  FisheyeCameraParametersV4,
} from '@core/interfaces/FisheyePreview';

/** every saved fisheye format that carries the manual `offset` (V1 is deprecated and has none) */
export type OffsetParams = FisheyeCameraParametersV2 | FisheyeCameraParametersV3 | FisheyeCameraParametersV4;

export const isOffsetParams = (data: unknown): data is OffsetParams =>
  typeof data === 'object' && data !== null && [2, 3, 4].includes((data as OffsetParams).v);
