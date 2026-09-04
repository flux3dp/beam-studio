import { Matrix4, Quaternion, Vector3 } from 'three';

import { cameraPointsToDisplayPositions } from './normalization';
import type { PointCloudConversionOptions } from './types';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BINARY_CHUNK = 0x004e4942;
const FLOAT_COMPONENT_TYPE = 5126;

interface GlbAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  sparse?: unknown;
  type: string;
}

interface GlbBufferView {
  buffer: number;
  byteLength: number;
  byteOffset?: number;
  byteStride?: number;
}

interface GlbMesh {
  primitives: Array<{ attributes?: { POSITION?: number } }>;
}

interface GlbNode {
  children?: number[];
  matrix?: number[];
  mesh?: number;
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  translation?: [number, number, number];
}

interface GlbJson {
  accessors?: GlbAccessor[];
  bufferViews?: GlbBufferView[];
  meshes?: GlbMesh[];
  nodes?: GlbNode[];
  scene?: number;
  scenes?: Array<{ nodes?: number[] }>;
}

const parseGlbChunks = (buffer: ArrayBuffer): { binary: Uint8Array; json: GlbJson } => {
  if (buffer.byteLength < 20) throw new Error('GLB is shorter than its header');

  const view = new DataView(buffer);

  if (view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== 2) {
    throw new Error('Only glTF 2.0 GLB point clouds are supported');
  }

  if (view.getUint32(8, true) !== buffer.byteLength) throw new Error('GLB length does not match its header');

  let offset = 12;
  let binary: Uint8Array | undefined;
  let json: GlbJson | undefined;

  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + chunkLength;

    if (end > buffer.byteLength) throw new Error('GLB chunk is truncated');

    if (chunkType === JSON_CHUNK) {
      const bytes = new Uint8Array(buffer, start, chunkLength);
      let contentLength = bytes.length;

      while (contentLength > 0 && (bytes[contentLength - 1] === 0 || bytes[contentLength - 1] === 0x20)) {
        contentLength -= 1;
      }

      const text = new TextDecoder().decode(bytes.subarray(0, contentLength));

      json = JSON.parse(text) as GlbJson;
    } else if (chunkType === BINARY_CHUNK) {
      binary = new Uint8Array(buffer, start, chunkLength);
    }

    offset = end;
  }

  if (!json || !binary) throw new Error('GLB must contain JSON and binary chunks');

  return { binary, json };
};

const getNodeMatrix = (node: GlbNode): Matrix4 => {
  if (node.matrix) {
    if (node.matrix.length !== 16) throw new Error('GLB node matrix must contain 16 values');

    return new Matrix4().fromArray(node.matrix);
  }

  return new Matrix4().compose(
    new Vector3().fromArray(node.translation ?? [0, 0, 0]),
    new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
    new Vector3().fromArray(node.scale ?? [1, 1, 1]),
  );
};

/** Extract world-space POSITION accessors from the GLB point-cloud output used by MapAnything. */
export const parseGlbPositions = (buffer: ArrayBuffer): Float32Array => {
  const { binary, json } = parseGlbChunks(buffer);
  const { accessors = [], bufferViews = [], meshes = [], nodes = [], scenes = [] } = json;
  const output: number[] = [];
  const childNodes = new Set(nodes.flatMap((node) => node.children ?? []));
  const roots =
    scenes[json.scene ?? 0]?.nodes ?? nodes.map((_, index) => index).filter((index) => !childNodes.has(index));

  const appendAccessor = (accessorIndex: number, matrix: Matrix4): void => {
    const accessor = accessors[accessorIndex];

    if (!accessor || accessor.bufferView === undefined) throw new Error('GLB POSITION accessor has no buffer view');

    if (accessor.componentType !== FLOAT_COMPONENT_TYPE || accessor.type !== 'VEC3' || accessor.sparse) {
      throw new Error('GLB POSITION accessor must be a non-sparse Float32 VEC3');
    }

    const bufferView = bufferViews[accessor.bufferView];

    if (!bufferView || bufferView.buffer !== 0) throw new Error('GLB POSITION buffer view is unsupported');

    const stride = bufferView.byteStride ?? 12;
    const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const end = start + Math.max(0, accessor.count - 1) * stride + 12;

    if (stride < 12 || end > binary.byteLength) throw new Error('GLB POSITION payload is truncated');

    const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
    const position = new Vector3();

    for (let index = 0; index < accessor.count; index += 1) {
      const offset = start + index * stride;

      position.set(view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true));
      position.applyMatrix4(matrix);
      output.push(position.x, position.y, position.z);
    }
  };

  const visitNode = (nodeIndex: number, parentMatrix: Matrix4, stack: Set<number>): void => {
    if (stack.has(nodeIndex)) throw new Error('GLB node graph contains a cycle');

    const node = nodes[nodeIndex];

    if (!node) throw new Error(`GLB references missing node ${nodeIndex}`);

    const worldMatrix = parentMatrix.clone().multiply(getNodeMatrix(node));

    if (node.mesh !== undefined) {
      const mesh = meshes[node.mesh];

      if (!mesh) throw new Error(`GLB references missing mesh ${node.mesh}`);

      mesh.primitives.forEach(({ attributes }) => {
        if (attributes?.POSITION !== undefined) appendAccessor(attributes.POSITION, worldMatrix);
      });
    }

    const nextStack = new Set(stack).add(nodeIndex);

    node.children?.forEach((child) => visitNode(child, worldMatrix, nextStack));
  };

  roots.forEach((node) => visitNode(node, new Matrix4(), new Set()));

  if (!output.length) throw new Error('GLB contains no point positions');

  return new Float32Array(output);
};

/** Convert MapAnything's OpenGL/glTF point cloud into proportionally scaled local BSPC positions. */
export const convertMapAnythingOutput = (buffer: ArrayBuffer, options?: PointCloudConversionOptions): Float32Array =>
  cameraPointsToDisplayPositions(
    parseGlbPositions(buffer),
    {
      depth: { index: 2, sign: -1 },
      horizontal: { index: 0, sign: 1 },
      vertical: { index: 1, sign: 1 },
    },
    options,
  );
