export interface PointCloudConversionOptions {
  /** Camera focal length used to back-project depth-only outputs. */
  focalLengthPx?: number;
  /** Invert a depth/height raster so smaller source values become the raised foreground. */
  invertDepth?: boolean;
  /** Longest raster edge used for the interactive relief mesh. */
  maxGridSize?: number;
  /** Browser preview guard; conversion keeps an evenly spaced subset above this count. */
  maxPoints?: number;
  /** Optional forced display depth; omit to preserve the source XYZ proportions. */
  reliefDepthMm?: number;
  /** Relief depth as a ratio of its finished width; avoids a fixed physical-depth assumption. */
  reliefDepthRatio?: number;
  /** Finished display width before the 3D-canvas transform is applied. */
  widthMm?: number;
}

export type ReplicatePointCloudFormat =
  | 'depth-anything-json'
  | 'depth-image'
  | 'depth-pro-npz'
  | 'glb'
  | 'normal-map-preview'
  | 'ply';

export type ReplicateSampleAvailability = 'importable' | 'preview-only';
export type ReplicateSampleCommercialUse = 'review' | boolean;
export type ReplicateSampleDisplay = 'point-cloud' | 'relief-mesh';

export interface ReplicatePointCloudSample {
  /** Current public example cost. Replicate bills by hardware time, so this is informational only. */
  approximateCostUsd: number;
  availability: ReplicateSampleAvailability;
  commercialUse: ReplicateSampleCommercialUse;
  conversionOptions?: PointCloudConversionOptions;
  /** Why the captured public result cannot be converted reliably in this PoC. */
  disabledReason?: string;
  /** Representations that can be derived from this captured result. */
  displays: ReadonlyArray<ReplicateSampleDisplay>;
  format: ReplicatePointCloudFormat;
  id: string;
  /** Original model input shown in the picker so the resulting geometry is recognisable. */
  inputPreview: { kind: 'image' | 'video'; url: string };
  label: string;
  license: string;
  model: string;
  modelUrl: string;
  outputUrl: string;
  /** Direct source image, or a Replicate tensor JSON containing its `image` field. */
  source: { kind: 'image' | 'tensor-json'; url: string };
  version: string;
}

export interface HeightField {
  data: Float32Array;
  height: number;
  mask?: Float32Array | Uint8Array;
  width: number;
}

export interface ReplicateTensor {
  data: string;
  dtype: string;
  shape: number[];
}

export interface DepthAnythingOutput {
  alpha_mask?: ReplicateTensor;
  depth: ReplicateTensor;
  image?: ReplicateTensor;
  original_shape?: { height: number; width: number };
  sky_mask?: ReplicateTensor;
}
