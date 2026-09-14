import { isUvDev2 } from '@core/helpers/is-dev';

import type {
  PointCloudConversionOptions,
  ReplicatePointCloudFormat,
  ReplicatePointCloudSample,
  ReplicateSampleCommercialUse,
  ReplicateSampleDisplay,
} from './types';

void isUvDev2();

type JsonPath = ReadonlyArray<number | string>;

interface PastedModelDefinition {
  approximateCostUsd: number;
  commercialUse: ReplicateSampleCommercialUse;
  conversionOptions?: PointCloudConversionOptions;
  displays: ReadonlyArray<ReplicateSampleDisplay>;
  format: ReplicatePointCloudFormat;
  hint: string;
  label: string;
  license: string;
  model: string;
  modelUrl: string;
  outputPaths: ReadonlyArray<JsonPath>;
  previewPaths?: ReadonlyArray<JsonPath>;
  referenceMeshPaths?: ReadonlyArray<JsonPath>;
}

const OUTPUT_PATHS = {
  direct: [['output'], []],
  mesh: [['output', 'mesh_glb'], ['mesh_glb'], ['output', 'mesh'], ['mesh']],
} as const;

export const PASTED_REPLICATE_MODELS = {
  'depth-anything-v2-small': {
    approximateCostUsd: 0.0023,
    commercialUse: true,
    conversionOptions: { reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-image',
    hint: 'Use model_size=Small. Reads output.grey_depth; a direct grey-depth PNG URL is also accepted.',
    label: 'Depth Anything V2 Small',
    license: 'Apache-2.0 (Small)',
    model: 'chenxwh/depth-anything-v2',
    modelUrl: 'https://replicate.com/chenxwh/depth-anything-v2',
    outputPaths: [['output', 'grey_depth'], ['grey_depth'], ...OUTPUT_PATHS.direct],
    previewPaths: [['output', 'grey_depth'], ['grey_depth']],
  },
  'depth-anything-v3-metric': {
    approximateCostUsd: 0.004,
    commercialUse: true,
    conversionOptions: { invertDepth: true, reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-anything-json',
    hint: 'Reads the first output.data tensor JSON URL. Paste the full prediction whenever possible.',
    label: 'Depth Anything V3 Metric',
    license: 'Apache-2.0',
    model: 'vufinder/depth-anything-v3-metric',
    modelUrl: 'https://replicate.com/vufinder/depth-anything-v3-metric',
    outputPaths: [['output', 'data', 0], ['data', 0], ...OUTPUT_PATHS.direct],
  },
  'depth-anything-v3-metric-large': {
    approximateCostUsd: 0.011,
    commercialUse: true,
    conversionOptions: { invertDepth: true, reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-image',
    hint: 'Reads a depth/depth_png PNG URL. You can paste the direct 16-bit depth PNG URL.',
    label: 'Depth Anything V3 Metric Large',
    license: 'Apache-2.0',
    model: 'david20321/depth-anything-v3-metric-large',
    modelUrl: 'https://replicate.com/david20321/depth-anything-v3-metric-large',
    outputPaths: [['output', 'depth_png'], ['depth_png'], ['output', 'depth'], ['depth'], ...OUTPUT_PATHS.direct],
  },
  'depth-anything-v3-mono': {
    approximateCostUsd: 0.00098,
    commercialUse: true,
    conversionOptions: { invertDepth: true, reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-anything-json',
    hint: 'Reads the first output.data tensor JSON URL. Paste the full prediction whenever possible.',
    label: 'Depth Anything V3 Mono',
    license: 'Apache-2.0',
    model: 'vufinder/depth-anything-v3-mono',
    modelUrl: 'https://replicate.com/vufinder/depth-anything-v3-mono',
    outputPaths: [['output', 'data', 0], ['data', 0], ...OUTPUT_PATHS.direct],
  },
  'depth-pro': {
    approximateCostUsd: 0.00098,
    commercialUse: true,
    conversionOptions: { invertDepth: true, reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-pro-npz',
    hint: 'Reads output.npz and its optional output.color_map preview.',
    label: 'Depth Pro',
    license: 'Apple Sample Code License',
    model: 'ibrahimpenekli/depth-pro',
    modelUrl: 'https://replicate.com/ibrahimpenekli/depth-pro',
    outputPaths: [['output', 'npz'], ['npz'], ...OUTPUT_PATHS.direct],
    previewPaths: [['output', 'color_map'], ['color_map']],
  },
  'map-anything': {
    approximateCostUsd: 0.0012,
    commercialUse: true,
    displays: ['point-cloud', 'reference-mesh'],
    format: 'glb',
    hint: 'Reads output.point_cloud and, when present, output.mesh. Paste the full prediction to retain the input.',
    label: 'MapAnything',
    license: 'Apache-2.0',
    model: 'vufinder/map-anything',
    modelUrl: 'https://replicate.com/vufinder/map-anything',
    outputPaths: [['output', 'point_cloud'], ['point_cloud'], ...OUTPUT_PATHS.direct],
    referenceMeshPaths: OUTPUT_PATHS.mesh,
  },
  midas: {
    approximateCostUsd: 0.0084,
    commercialUse: true,
    conversionOptions: { reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-image',
    hint: 'Reads the output depth image URL; a direct output PNG URL is also accepted.',
    label: 'MiDaS',
    license: 'MIT',
    model: 'cjwbw/midas',
    modelUrl: 'https://replicate.com/cjwbw/midas',
    outputPaths: OUTPUT_PATHS.direct,
  },
  moge2: {
    approximateCostUsd: 0.0018,
    commercialUse: true,
    displays: ['point-cloud', 'reference-mesh'],
    format: 'ply',
    hint: 'Reads output.pointcloud_ply and, when present, output.mesh_glb. output.image_jpg can supply the source.',
    label: 'MoGe-2',
    license: 'MIT',
    model: 'jasonod888/moge2',
    modelUrl: 'https://replicate.com/jasonod888/moge2',
    outputPaths: [
      ['output', 'pointcloud_ply'],
      ['pointcloud_ply'],
      ['output', 'point_cloud'],
      ['point_cloud'],
      ...OUTPUT_PATHS.direct,
    ],
    previewPaths: [['output', 'depth_vis_png'], ['depth_vis_png'], ['output', 'depth_vis'], ['depth_vis']],
    referenceMeshPaths: OUTPUT_PATHS.mesh,
  },
  zoedepth: {
    approximateCostUsd: 0.0006,
    commercialUse: true,
    conversionOptions: { reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-image',
    hint: 'Reads the output depth image URL; a direct output PNG URL is also accepted.',
    label: 'ZoeDepth',
    license: 'MIT',
    model: 'cjwbw/zoedepth',
    modelUrl: 'https://replicate.com/cjwbw/zoedepth',
    outputPaths: OUTPUT_PATHS.direct,
  },
} as const satisfies Record<string, PastedModelDefinition>;

export type PastedReplicateModelId = keyof typeof PASTED_REPLICATE_MODELS;

const PASTED_MODEL_ORDER = [
  'moge2',
  'map-anything',
  'depth-anything-v3-mono',
  'depth-anything-v3-metric',
  'depth-pro',
  'depth-anything-v3-metric-large',
  'zoedepth',
  'depth-anything-v2-small',
  'midas',
] as const satisfies ReadonlyArray<PastedReplicateModelId>;

export const PASTED_REPLICATE_MODEL_OPTIONS = PASTED_MODEL_ORDER.map((value) => ({
  label: PASTED_REPLICATE_MODELS[value].label,
  value,
}));

const SOURCE_PATHS: ReadonlyArray<JsonPath> = [
  ['input', 'image'],
  ['input', 'image_path'],
  ['input', 'inputs', 0],
  ['image'],
  ['image_path'],
  ['inputs', 0],
  ['output', 'image_jpg'],
  ['image_jpg'],
];

const getPathValue = (root: unknown, path: JsonPath): unknown =>
  path.reduce<unknown>((value, key) => {
    if (typeof key === 'number') return Array.isArray(value) ? value[key] : undefined;

    return value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
  }, root);

/** Accept Replicate's raw URL or the `[url](url)` strings produced when copied from rich text. */
export const normalizePastedReplicateUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  const markdownUrl = trimmed.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/)?.[1];
  const candidate = markdownUrl ?? trimmed.replace(/^['"]|['"]$/g, '');

  if (/^core-img\/replicate-3d\/[\w.-]+$/.test(candidate)) return candidate;

  try {
    const url = new URL(candidate);

    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const findUrl = (root: unknown, paths: ReadonlyArray<JsonPath>): string | undefined => {
  for (const path of paths) {
    const url = normalizePastedReplicateUrl(getPathValue(root, path));

    if (url) return url;
  }

  return undefined;
};

const parsePastedValue = (text: string): unknown => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const directUrl = normalizePastedReplicateUrl(cleaned);

  if (directUrl) return directUrl;

  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    throw new SyntaxError('Paste valid Replicate prediction JSON or a direct output URL.');
  }
};

const getString = (root: unknown, path: JsonPath): string | undefined => {
  const value = getPathValue(root, path);

  return typeof value === 'string' ? value : undefined;
};

const getNumber = (root: unknown, paths: ReadonlyArray<JsonPath>): number | undefined => {
  for (const path of paths) {
    const value = getPathValue(root, path);

    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }

  return undefined;
};

interface CreatePastedReplicateSampleOptions {
  label?: string;
  modelId: PastedReplicateModelId;
  pastedOutput: string;
  sourceUrl?: string;
}

/** Convert copied Replicate output metadata into the same frontend fixture shape as constants. */
export const createPastedReplicateSample = ({
  label,
  modelId,
  pastedOutput,
  sourceUrl,
}: CreatePastedReplicateSampleOptions): ReplicatePointCloudSample => {
  const definition: PastedModelDefinition = PASTED_REPLICATE_MODELS[modelId];
  const parsed = parsePastedValue(pastedOutput);
  const outputUrl = findUrl(parsed, definition.outputPaths);

  if (!outputUrl) throw new Error(`Could not find the ${definition.label} primary output URL.`);

  const source = normalizePastedReplicateUrl(sourceUrl) ?? findUrl(parsed, SOURCE_PATHS);

  if (!source) throw new Error('Could not find the input image URL. Paste it in the optional source field.');

  const referenceMeshUrl = definition.referenceMeshPaths ? findUrl(parsed, definition.referenceMeshPaths) : undefined;
  const displays = definition.displays.filter((display) => display !== 'reference-mesh' || referenceMeshUrl);
  const previewUrl = definition.previewPaths ? findUrl(parsed, definition.previewPaths) : undefined;
  const resultPreviewUrl = previewUrl ?? (definition.format === 'depth-image' ? outputUrl : undefined);
  const version = getString(parsed, ['version']) ?? 'pasted-result';
  const idSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const focalLengthPx =
    modelId === 'depth-pro' ? getNumber(parsed, [['output', 'focal_length'], ['focal_length']]) : undefined;

  return {
    approximateCostUsd: definition.approximateCostUsd,
    availability: 'importable',
    commercialUse: definition.commercialUse,
    conversionOptions: { ...definition.conversionOptions, ...(focalLengthPx ? { focalLengthPx } : {}) },
    displayOutputs: referenceMeshUrl ? { 'reference-mesh': { format: 'glb-mesh', url: referenceMeshUrl } } : undefined,
    displays,
    format: definition.format,
    group: 'pasted-result',
    id: `pasted-${modelId}-${idSuffix}`,
    inputPreview: { kind: 'image', url: source },
    label: label?.trim() || `${definition.label} - Pasted result`,
    license: definition.license,
    model: definition.model,
    modelUrl: definition.modelUrl,
    outputUrl,
    resultNote: 'Pasted test result stored locally in this browser. Replicate is not called by Beam Studio.',
    resultPreview: resultPreviewUrl ? { kind: 'image', label: 'Output', url: resultPreviewUrl } : undefined,
    source: { kind: 'image', url: source },
    version,
  };
};
