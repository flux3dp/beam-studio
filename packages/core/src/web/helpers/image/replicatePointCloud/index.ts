import type { BufferGeometry } from 'three';
import { match } from 'ts-pattern';

import { encodePointCloud } from '@core/app/svgedit/stl/pointCloud';

import { getReplicatePointCloudSample } from './constants';
import type { ReplicatePointCloudSampleId } from './constants';
import { convertDepthAnythingV3Output, parseDepthAnythingHeightField, tensorJsonImageToBlob } from './depthAnything';
import { convertDepthProOutput, parseDepthProHeightField } from './depthPro';
import { convertMapAnythingOutput, parseGlbMeshGeometry } from './glb';
import {
  createReliefGeometry,
  createReliefPointPositions,
  exportReliefGeometry,
  imageBlobToHeightField,
} from './heightField';
import { convertMoge2Output } from './ply';
import type { PointCloudConversionOptions, ReplicatePointCloudSample, ReplicateSampleDisplay } from './types';

export { REPLICATE_POINT_CLOUD_SAMPLES } from './constants';
export type { ReplicatePointCloudSampleId } from './constants';
export { convertDepthAnythingV3Output, parseDepthAnythingHeightField, tensorJsonImageToBlob } from './depthAnything';
export { convertDepthProOutput, parseDepthProHeightField, parseNpyFloat32 } from './depthPro';
export { convertMapAnythingOutput, getGlbPrimitiveKinds, parseGlbMeshGeometry, parseGlbPositions } from './glb';
export {
  createReliefGeometry,
  createReliefPointPositions,
  exportReliefGeometry,
  imageBlobToHeightField,
} from './heightField';
export {
  createPastedReplicateSample,
  normalizePastedReplicateUrl,
  PASTED_REPLICATE_MODEL_OPTIONS,
  PASTED_REPLICATE_MODELS,
} from './pastedResult';
export type { PastedReplicateModelId } from './pastedResult';
export { convertMoge2Output, parsePlyPositions } from './ply';
export type {
  DepthAnythingOutput,
  HeightField,
  PointCloudConversionOptions,
  ReplicatePointCloudFormat,
  ReplicatePointCloudSample,
  ReplicateSampleAvailability,
  ReplicateSampleCommercialUse,
  ReplicateSampleDisplay,
  ReplicateSampleGroup,
  ReplicateSampleOutput,
  ReplicateSampleRunMetrics,
  ReplicateTensor,
} from './types';

const fetchPublicAsset = async (url: string): Promise<Response> => {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Unable to download Replicate sample (${response.status})`);

  return response;
};

const getDisplayOutput = (sample: ReplicatePointCloudSample, display: ReplicateSampleDisplay) =>
  sample.displayOutputs?.[display] ?? { format: sample.format, url: sample.outputUrl };

/**
 * Frontend test-fixture adapter followed by the shared BSPC encoder used by the 3D canvas and
 * `.beam` block 7. Prediction creation and provider authentication intentionally live elsewhere.
 */
export const fetchReplicatePointCloudBuffer = async (
  sample: ReplicatePointCloudSample,
  options?: PointCloudConversionOptions,
): Promise<ArrayBuffer> => {
  if (sample.availability !== 'importable' || !sample.displays.includes('point-cloud')) {
    throw new Error(`${sample.label} is not an importable point-cloud sample`);
  }

  const output = getDisplayOutput(sample, 'point-cloud');
  const response = await fetchPublicAsset(output.url);
  const conversionOptions = { ...sample.conversionOptions, ...options };
  const positions = await match(output.format)
    .with('ply', async () => convertMoge2Output(await response.arrayBuffer(), conversionOptions))
    .with('glb', async () => convertMapAnythingOutput(await response.arrayBuffer(), conversionOptions))
    .with('depth-anything-json', async () => convertDepthAnythingV3Output(await response.text(), conversionOptions))
    .with('depth-pro-npz', async () => convertDepthProOutput(await response.arrayBuffer(), conversionOptions))
    .with('depth-image', async () =>
      createReliefPointPositions(await imageBlobToHeightField(await response.blob()), conversionOptions),
    )
    .otherwise(() => {
      throw new Error(`${sample.label} does not expose point-cloud data`);
    });

  return encodePointCloud(positions);
};

/** Fetch the retained 2D source that lets the imported point cloud participate in SVG history. */
export const fetchReplicateSampleSource = async (sample: ReplicatePointCloudSample): Promise<Blob> => {
  const response = await fetchPublicAsset(sample.source.url);

  return match(sample.source.kind)
    .with('image', () => response.blob())
    .with('tensor-json', async () => tensorJsonImageToBlob(await response.text()))
    .exhaustive();
};

export const fetchReplicateSampleAssets = async (
  id: ReplicatePointCloudSampleId,
  options?: PointCloudConversionOptions,
): Promise<{ pointCloudBuffer: ArrayBuffer; source: Blob }> => {
  const sample = getReplicatePointCloudSample(id);
  const [pointCloudBuffer, source] = await Promise.all([
    fetchReplicatePointCloudBuffer(sample, options),
    fetchReplicateSampleSource(sample),
  ]);

  return { pointCloudBuffer, source };
};

const fetchReplicateMeshGeometry = async (
  sample: ReplicatePointCloudSample,
  display: Exclude<ReplicateSampleDisplay, 'point-cloud'>,
): Promise<BufferGeometry> => {
  if (sample.availability !== 'importable' || !sample.displays.includes(display)) {
    throw new Error(sample.disabledReason ?? `${sample.label} is not an importable mesh sample`);
  }

  const output = getDisplayOutput(sample, display);
  const response = await fetchPublicAsset(output.url);

  if (output.format === 'glb-mesh') return parseGlbMeshGeometry(await response.arrayBuffer(), sample.conversionOptions);

  const field = await match(output.format)
    .with('depth-anything-json', async () => parseDepthAnythingHeightField(await response.text()))
    .with('depth-pro-npz', async () => parseDepthProHeightField(await response.arrayBuffer()))
    .with('depth-image', async () => imageBlobToHeightField(await response.blob()))
    .otherwise(() => {
      throw new Error(`${sample.label} does not expose a usable height field`);
    });

  return createReliefGeometry(field, sample.conversionOptions);
};

export const fetchReplicateReliefGeometry = async (sample: ReplicatePointCloudSample): Promise<BufferGeometry> =>
  fetchReplicateMeshGeometry(sample, 'relief-mesh');

export type ReplicateSampleResult =
  | { buffer: ArrayBuffer; geometry: BufferGeometry; kind: 'mesh' }
  | { kind: 'point-cloud'; pointCloudBuffer: ArrayBuffer; source: Blob };

type ReplicateSampleReference = ReplicatePointCloudSample | ReplicatePointCloudSampleId;

/** Resolve one fixed captured result into the native 3D representation used by Beam Studio. */
export const fetchReplicateSampleResult = async (
  reference: ReplicateSampleReference,
  display: ReplicateSampleDisplay,
): Promise<ReplicateSampleResult> => {
  const sample = typeof reference === 'string' ? getReplicatePointCloudSample(reference) : reference;

  if (sample.availability !== 'importable') {
    throw new Error(sample.disabledReason ?? `${sample.label} is preview-only`);
  }

  if (!sample.displays.includes(display)) {
    throw new Error(`${sample.label} cannot be displayed as ${display}`);
  }

  if (display === 'point-cloud') {
    const [pointCloudBuffer, source] = await Promise.all([
      fetchReplicatePointCloudBuffer(sample),
      fetchReplicateSampleSource(sample),
    ]);

    return { kind: 'point-cloud', pointCloudBuffer, source };
  }

  const geometry = await fetchReplicateMeshGeometry(sample, display);

  return { buffer: exportReliefGeometry(geometry), geometry, kind: 'mesh' };
};
