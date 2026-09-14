import { isUvDev2 } from '@core/helpers/is-dev';

import { REPLICATE_CAPTURED_TEST_SAMPLES } from './capturedTests';
import type { ReplicatePointCloudSample } from './types';

void isUvDev2();

/**
 * Frontend-only result fixtures. Local comparison runs are listed first; the public examples below
 * were captured from Replicate on 2026-09-03.
 *
 * Keep the model version and immutable output URL together. Adding our own comparison images later
 * only requires appending another entry named, for example, `moge-2-test-1`; the UI and conversion
 * dispatch are data-driven from this list. This is deliberately not Replicate API configuration:
 * Beam Studio neither creates predictions nor owns provider credentials.
 */
export const REPLICATE_POINT_CLOUD_SAMPLES = [
  ...REPLICATE_CAPTURED_TEST_SAMPLES,
  {
    approximateCostUsd: 0.0018,
    availability: 'importable',
    commercialUse: true,
    displays: ['point-cloud'],
    format: 'ply',
    id: 'moge-2-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/OEfc3PxnbWLGDjSnovEXGpF2TlbwlmmK7Lxx4yNhHuE4tSQ0/LivingRoom.jpg',
    },
    label: 'MoGe-2 - Example',
    license: 'MIT',
    model: 'jasonod888/moge2',
    modelUrl: 'https://replicate.com/jasonod888/moge2',
    outputUrl: 'https://replicate.delivery/czjl/bpZFPEumDOKQON9PJUrENWq3juijH8c1iFcsKjI8UoBIk0cF/pointcloud.ply',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/OEfc3PxnbWLGDjSnovEXGpF2TlbwlmmK7Lxx4yNhHuE4tSQ0/LivingRoom.jpg',
    },
    version: '5cd8c16fede1c9566cebc81d16d319e1a26b8111eaf5a8ca12bc6263f2e0e68d',
  },
  {
    approximateCostUsd: 0.0012,
    availability: 'importable',
    commercialUse: true,
    displays: ['point-cloud'],
    format: 'glb',
    id: 'map-anything-example',
    inputPreview: {
      kind: 'video',
      url: 'https://replicate.delivery/pbxt/OelG0aY8B67S2WjnPW89R2rjf5JxrdUXfOXyPEOxe86lXBDp/001.mp4',
    },
    label: 'MapAnything - Example',
    license: 'Apache-2.0',
    model: 'vufinder/map-anything',
    modelUrl: 'https://replicate.com/vufinder/map-anything',
    outputUrl: 'https://replicate.delivery/xezq/rmqntzM8Xna5PR9rG9Nt1JCKMI85Bc6MFA8DXyDL36Fud4iF/point_cloud.glb',
    // The public example input is a video. Its first extracted 2D frame is embedded in this output
    // JSON and is used only as the retained SVG source behind the point cloud.
    source: {
      kind: 'tensor-json',
      url: 'https://replicate.delivery/xezq/0Ge9rXNAKAXveEeHyRnESBB4eroMoIJepfrOffQoNkKW52hLWA/image_0001.json',
    },
    version: '817f6ce189a0d302f3f1da142ff5993f28eaa8838f0f50f0ab48cfc2095cd413',
  },
  {
    approximateCostUsd: 0.00098,
    availability: 'importable',
    commercialUse: true,
    conversionOptions: { invertDepth: true, reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-anything-json',
    id: 'depth-anything-v3-mono-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/ODpfJVZ54u7nvojTMGBefPnvWuGYpICtB687Zg3DE3viFeIP/input.jpeg',
    },
    label: 'Depth Anything V3 Mono - Example',
    license: 'Apache-2.0',
    model: 'vufinder/depth-anything-v3-mono',
    modelUrl: 'https://replicate.com/vufinder/depth-anything-v3-mono',
    outputUrl: 'https://replicate.delivery/xezq/pPVzKLLGGRI4BheU6Cr9LYo8IloOuKxGnZKAhgBfq8ld1Q9VA/image_0001.json',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/ODpfJVZ54u7nvojTMGBefPnvWuGYpICtB687Zg3DE3viFeIP/input.jpeg',
    },
    version: '2dad523efc4f21f134480ef1878e7a145c1d761d156d558392002196703f2e45',
  },
  {
    approximateCostUsd: 0.0038,
    availability: 'importable',
    commercialUse: true,
    conversionOptions: { invertDepth: true, reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-anything-json',
    id: 'depth-anything-v3-metric-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/OEmjFw8pjScJHQgtemSJuFNiFhRU0okjzabz5nbkpV9xdn45/input.jpeg',
    },
    label: 'Depth Anything V3 Metric - Example',
    license: 'Apache-2.0',
    model: 'vufinder/depth-anything-v3-metric',
    modelUrl: 'https://replicate.com/vufinder/depth-anything-v3-metric',
    outputUrl: 'https://replicate.delivery/xezq/tt8wNNYhgQLyDxhaY9taXGpNNjdWcnw7BoQAfW9vEPthXoeVA/image_0001.json',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/OEmjFw8pjScJHQgtemSJuFNiFhRU0okjzabz5nbkpV9xdn45/input.jpeg',
    },
    version: '38b57a7e00b04b4656ae9566097d60a1a08665bbbc07db97f085d0c8262efbc5',
  },
  {
    approximateCostUsd: 0.00098,
    availability: 'importable',
    commercialUse: true,
    conversionOptions: { focalLengthPx: 1867.4205322265625, invertDepth: true, reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-pro-npz',
    id: 'depth-pro-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/NXClbTyhH6Fo7ltHX5TRfWF02mqVUPGoZljb0e4GDSMHCQ1m/2480-color.jpg',
    },
    label: 'Depth Pro - Example',
    license: 'Apple Sample Code License',
    model: 'ibrahimpenekli/depth-pro',
    modelUrl: 'https://replicate.com/ibrahimpenekli/depth-pro',
    outputUrl: 'https://replicate.delivery/xezq/010FAm7KOsaUMJ604MbfKBEeifDy4WwUnvOGJ9kwwRFmh2VqA/out.npz',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/NXClbTyhH6Fo7ltHX5TRfWF02mqVUPGoZljb0e4GDSMHCQ1m/2480-color.jpg',
    },
    version: '8bee17f621ab23567c836703be980b3aa1552127b252b7ef9f6ce6db6c4619ef',
  },
  {
    approximateCostUsd: 0.009,
    availability: 'importable',
    commercialUse: true,
    conversionOptions: { invertDepth: true, reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-image',
    id: 'depth-anything-v3-metric-large-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/OcMafuY4KwevJYoDZjBF5lDvVDpSulVXIirFuBM4Q1390MKL/ComfyUI_09858_.png',
    },
    label: 'Depth Anything V3 Metric Large - Example',
    license: 'Apache-2.0',
    model: 'david20321/depth-anything-v3-metric-large',
    modelUrl: 'https://replicate.com/david20321/depth-anything-v3-metric-large',
    outputUrl:
      'https://replicate.delivery/czjl/Yfhm8k3niIymb6uqjTUeEvYzXBnCaqoPHUumIHCYe9dpjkSsA/da3_depth_e0jsxq92.png',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/OcMafuY4KwevJYoDZjBF5lDvVDpSulVXIirFuBM4Q1390MKL/ComfyUI_09858_.png',
    },
    version: 'c553df43ef33de388096c3d7296cab778ac54742044b61dea6f3b96617f85cd5',
  },
  {
    approximateCostUsd: 0.016,
    availability: 'preview-only',
    commercialUse: 'review',
    disabledReason: 'Public example only exposes a colourised preview, not raw depth values.',
    displays: ['relief-mesh'],
    format: 'depth-image',
    id: 'patch-fusion-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/K7bks8mWnMxlQC19IPeFGtfr9YtGEUw5vgQhiu3olsD6vcoU/example_2.jpeg',
    },
    label: 'PatchFusion - Preview only',
    license: 'Review model weights',
    model: 'zsxkib/patch-fusion',
    modelUrl: 'https://replicate.com/zsxkib/patch-fusion',
    outputUrl: 'https://replicate.delivery/pbxt/GeyWb4sL7iyMZaEGFxMT9dwOQrxlUbYVvgRNALoHGnyhaODJA/image_0.png',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/K7bks8mWnMxlQC19IPeFGtfr9YtGEUw5vgQhiu3olsD6vcoU/example_2.jpeg',
    },
    version: 'db14d618e1a28b48decb7c91ff550d2f07e66cdb632630a65716f9be73c4d0ad',
  },
  {
    approximateCostUsd: 0.026,
    availability: 'preview-only',
    commercialUse: 'review',
    disabledReason: 'The public prediction exposes visualisations but no raw metric-depth file.',
    displays: ['relief-mesh'],
    format: 'depth-image',
    id: 'metric3dv2-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/OqBNkRBo2uOAXpp9kAFc0nRNKbz8SR48OTlksentREfsK8Xx/put-together-a-perfect-guest-room-1976987-hero-223e3e8f697e4b13b62ad4fe898d492d.jpg',
    },
    label: 'Metric3D V2 - Preview only',
    license: 'Commercial terms require review',
    model: 'visionaix/metric3dv2',
    modelUrl: 'https://replicate.com/visionaix/metric3dv2',
    outputUrl: 'https://replicate.com/visionaix/metric3dv2',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/OqBNkRBo2uOAXpp9kAFc0nRNKbz8SR48OTlksentREfsK8Xx/put-together-a-perfect-guest-room-1976987-hero-223e3e8f697e4b13b62ad4fe898d492d.jpg',
    },
    version: 'bbf71abe79f8a95fce080dc07f1cb6bcd215b3a237631fdb7189661d3738e883',
  },
  {
    approximateCostUsd: 0.0006,
    availability: 'importable',
    commercialUse: true,
    conversionOptions: { reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-image',
    id: 'zoedepth-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/IPzzqLRb2x6XwGUK28l7dNTFO9MzQG1WmY2sdapZ2tnEdmMF/123.png',
    },
    label: 'ZoeDepth - Example',
    license: 'MIT',
    model: 'cjwbw/zoedepth',
    modelUrl: 'https://replicate.com/cjwbw/zoedepth',
    outputUrl: 'https://replicate.delivery/pbxt/Yiy3JvNLmMpkKZhuAamOPUjdFUYn5OIl0xPlu04aTfBpbMSIA/out.png',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/IPzzqLRb2x6XwGUK28l7dNTFO9MzQG1WmY2sdapZ2tnEdmMF/123.png',
    },
    version: '6375723d97400d3ac7b88e3022b738bf6f433ae165c4a2acd1955eaa6b8fcb62',
  },
  {
    approximateCostUsd: 0.0023,
    availability: 'preview-only',
    commercialUse: false,
    disabledReason: 'This public example uses the non-commercial Large checkpoint; only Small is Apache-2.0.',
    displays: ['relief-mesh'],
    format: 'depth-image',
    id: 'depth-anything-v2-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/LBRD51RN86Ferepw2ClsJWKFn0oWhnSsuCzBIap416ksUJzg/demo07.jpg',
    },
    label: 'Depth Anything V2 Large - Preview only',
    license: 'CC-BY-NC-4.0 (Large)',
    model: 'chenxwh/depth-anything-v2',
    modelUrl: 'https://replicate.com/chenxwh/depth-anything-v2',
    outputUrl: 'https://replicate.delivery/pbxt/ffkeILYwgNVTGpeZxQAek7jADMXRlXN3oxRCSDN30MQNymcYC/grey.png',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/LBRD51RN86Ferepw2ClsJWKFn0oWhnSsuCzBIap416ksUJzg/demo07.jpg',
    },
    version: 'b239ea33cff32bb7abb5db39ffe9a09c14cbc2894331d1ef66fe096eed88ebd4',
  },
  {
    approximateCostUsd: 0.0084,
    availability: 'importable',
    commercialUse: true,
    conversionOptions: { reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-image',
    id: 'midas-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/IJXKZmd7SqUi1ioRdfA88ujj9OBy9zzGOsX0wyhuq1ElBMba/dog.jpg',
    },
    label: 'MiDaS - Example',
    license: 'MIT',
    model: 'cjwbw/midas',
    modelUrl: 'https://replicate.com/cjwbw/midas',
    outputUrl: 'https://replicate.delivery/pbxt/tweLmgVgBlRUOqF4JWvZI6wLlBiYaeNtDXKQGcthB8S92YegA/out.png',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/IJXKZmd7SqUi1ioRdfA88ujj9OBy9zzGOsX0wyhuq1ElBMba/dog.jpg',
    },
    version: 'a6ba5798f04f80d3b314de0f0a62277f21ab3503c60c84d4817de83c5edfdae0',
  },
  {
    approximateCostUsd: 0.02,
    availability: 'importable',
    commercialUse: true,
    conversionOptions: { reliefDepthRatio: 0.22 },
    displays: ['point-cloud', 'relief-mesh'],
    format: 'depth-image',
    id: 'patina-height-example',
    inputPreview: {
      kind: 'image',
      url: 'https://storage.googleapis.com/falserverless/gallery/patina-blog-hero-basecolor.png',
    },
    label: 'PATINA Height Map - Example',
    license: 'Commercial API terms',
    model: 'fal-ai/patina',
    modelUrl: 'https://fal.ai/models/fal-ai/patina',
    outputUrl: 'https://storage.googleapis.com/falserverless/gallery/patina-blog-hero-height.png',
    source: {
      kind: 'image',
      url: 'https://storage.googleapis.com/falserverless/gallery/patina-blog-hero-basecolor.png',
    },
    version: 'public-example-2026-09-03',
  },
  {
    approximateCostUsd: 0.00031,
    availability: 'preview-only',
    commercialUse: 'review',
    disabledReason: 'A normal map alone does not define a unique height field without an integration boundary.',
    displays: ['relief-mesh'],
    format: 'normal-map-preview',
    id: 'marigold-normals-v2-example',
    inputPreview: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/O55glJ3CN79Wb62ZZlVsBIoh6dv00f027SCnLnes9KsFv8yi/WhatsApp%20Image%202025-10-15%20at%2022.08.18_9ed7de3d.jpg',
    },
    label: 'Marigold Normals V2 - Preview only',
    license: 'Open RAIL; review use restrictions',
    model: 'jasonod888/marigold-normalsv2',
    modelUrl: 'https://replicate.com/jasonod888/marigold-normalsv2',
    outputUrl: 'https://replicate.delivery/czjl/2CFcjKYX3pZADd6IbIcdQEjEni3hKB3JfkL2VejtobhdfxUrA/normals_output.png',
    source: {
      kind: 'image',
      url: 'https://replicate.delivery/pbxt/O55glJ3CN79Wb62ZZlVsBIoh6dv00f027SCnLnes9KsFv8yi/WhatsApp%20Image%202025-10-15%20at%2022.08.18_9ed7de3d.jpg',
    },
    version: '3129bd0f2d415e73d6cb6bccca11eba9c6dc9105129f0f3637b5dec5baa6cb4d',
  },
] as const satisfies ReadonlyArray<ReplicatePointCloudSample>;

export type ReplicatePointCloudSampleId = (typeof REPLICATE_POINT_CLOUD_SAMPLES)[number]['id'];

export const getReplicatePointCloudSample = (id: ReplicatePointCloudSampleId): ReplicatePointCloudSample => {
  const sample = REPLICATE_POINT_CLOUD_SAMPLES.find((candidate) => candidate.id === id);

  if (!sample) throw new Error(`Unknown Replicate point-cloud sample: ${id}`);

  return sample;
};
