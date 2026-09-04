import type { BufferGeometry } from 'three';
import { match } from 'ts-pattern';

import { encodePointCloud } from '@core/app/svgedit/stl/pointCloud';

import { getReplicatePointCloudSample } from './constants';
import type { ReplicatePointCloudSampleId } from './constants';
import { convertDepthAnythingV3Output, parseDepthAnythingHeightField, tensorJsonImageToBlob } from './depthAnything';
import { convertDepthProOutput, parseDepthProHeightField } from './depthPro';
import { convertMapAnythingOutput } from './glb';
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
export { convertMapAnythingOutput, parseGlbPositions } from './glb';
export {
  createReliefGeometry,
  createReliefPointPositions,
  exportReliefGeometry,
  imageBlobToHeightField,
} from './heightField';
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
  ReplicateTensor,
} from './types';

const fetchPublicAsset = async (url: string): Promise<Response> => {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Unable to download Replicate sample (${response.status})`);

  return response;
};

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

  const response = await fetchPublicAsset(sample.outputUrl);
  const conversionOptions = { ...sample.conversionOptions, ...options };
  const positions = await match(sample.format)
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

export const fetchReplicateReliefGeometry = async (sample: ReplicatePointCloudSample): Promise<BufferGeometry> => {
  if (sample.availability !== 'importable' || !sample.displays.includes('relief-mesh')) {
    throw new Error(sample.disabledReason ?? `${sample.label} is not an importable relief sample`);
  }

  const response = await fetchPublicAsset(sample.outputUrl);
  const field = await match(sample.format)
    .with('depth-anything-json', async () => parseDepthAnythingHeightField(await response.text()))
    .with('depth-pro-npz', async () => parseDepthProHeightField(await response.arrayBuffer()))
    .with('depth-image', async () => imageBlobToHeightField(await response.blob()))
    .otherwise(() => {
      throw new Error(`${sample.label} does not expose a usable height field`);
    });

  return createReliefGeometry(field, sample.conversionOptions);
};

export type ReplicateSampleResult =
  | { buffer: ArrayBuffer; geometry: BufferGeometry; kind: 'relief-mesh' }
  | { kind: 'point-cloud'; pointCloudBuffer: ArrayBuffer; source: Blob };

/** Resolve one fixed public result into the native 3D representation used by Beam Studio. */
export const fetchReplicateSampleResult = async (
  id: ReplicatePointCloudSampleId,
  display: ReplicateSampleDisplay,
): Promise<ReplicateSampleResult> => {
  const sample = getReplicatePointCloudSample(id);

  if (sample.availability !== 'importable') {
    throw new Error(sample.disabledReason ?? `${sample.label} is preview-only`);
  }

  if (!sample.displays.includes(display)) {
    throw new Error(`${sample.label} cannot be displayed as ${display}`);
  }

  if (display === 'point-cloud') {
    return { kind: 'point-cloud', ...(await fetchReplicateSampleAssets(id)) };
  }

  const geometry = await fetchReplicateReliefGeometry(sample);

  return { buffer: exportReliefGeometry(geometry), geometry, kind: 'relief-mesh' };
};
