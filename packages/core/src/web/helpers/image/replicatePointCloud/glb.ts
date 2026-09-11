import { BufferGeometry, Float32BufferAttribute, Matrix4, Quaternion, Uint32BufferAttribute, Vector3 } from 'three';

import { cameraPointsToDisplayPositions } from './normalization';
import type { PointCloudConversionOptions } from './types';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BINARY_CHUNK = 0x004e4942;
const FLOAT_COMPONENT_TYPE = 5126;
const POINTS_MODE = 0;
const TRIANGLES_MODE = 4;
const DEFAULT_WIDTH_MM = 100;

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

interface GlbPrimitive {
  attributes?: { POSITION?: number };
  indices?: number;
  mode?: number;
}

interface GlbMesh {
  primitives: GlbPrimitive[];
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
    throw new Error('Only glTF 2.0 GLB files are supported');
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

const visitPrimitives = (json: GlbJson, callback: (primitive: GlbPrimitive, matrix: Matrix4) => void): void => {
  const { meshes = [], nodes = [], scenes = [] } = json;
  const childNodes = new Set(nodes.flatMap((node) => node.children ?? []));
  const roots =
    scenes[json.scene ?? 0]?.nodes ?? nodes.map((_, index) => index).filter((index) => !childNodes.has(index));

  const visitNode = (nodeIndex: number, parentMatrix: Matrix4, stack: Set<number>): void => {
    if (stack.has(nodeIndex)) throw new Error('GLB node graph contains a cycle');

    const node = nodes[nodeIndex];

    if (!node) throw new Error(`GLB references missing node ${nodeIndex}`);

    const worldMatrix = parentMatrix.clone().multiply(getNodeMatrix(node));

    if (node.mesh !== undefined) {
      const mesh = meshes[node.mesh];

      if (!mesh) throw new Error(`GLB references missing mesh ${node.mesh}`);

      mesh.primitives.forEach((primitive) => callback(primitive, worldMatrix));
    }

    const nextStack = new Set(stack).add(nodeIndex);

    node.children?.forEach((child) => visitNode(child, worldMatrix, nextStack));
  };

  roots.forEach((node) => visitNode(node, new Matrix4(), new Set()));
};

const readPositionAccessor = (
  binary: Uint8Array,
  json: GlbJson,
  accessorIndex: number,
  matrix: Matrix4,
): Float32Array => {
  const { accessors = [], bufferViews = [] } = json;
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
  const output = new Float32Array(accessor.count * 3);
  const position = new Vector3();

  for (let index = 0; index < accessor.count; index += 1) {
    const offset = start + index * stride;

    position.set(view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true));
    position.applyMatrix4(matrix);
    position.toArray(output, index * 3);
  }

  return output;
};

const readIndexAccessor = (binary: Uint8Array, json: GlbJson, accessorIndex: number): Uint32Array => {
  const { accessors = [], bufferViews = [] } = json;
  const accessor = accessors[accessorIndex];

  if (!accessor || accessor.bufferView === undefined) throw new Error('GLB index accessor has no buffer view');

  if (accessor.type !== 'SCALAR' || accessor.sparse) throw new Error('GLB index accessor must be non-sparse SCALAR');

  const componentBytes = accessor.componentType === 5121 ? 1 : accessor.componentType === 5123 ? 2 : 4;

  if (![5121, 5123, 5125].includes(accessor.componentType)) {
    throw new Error(`Unsupported GLB index component type: ${accessor.componentType}`);
  }

  const bufferView = bufferViews[accessor.bufferView];

  if (!bufferView || bufferView.buffer !== 0) throw new Error('GLB index buffer view is unsupported');

  const stride = bufferView.byteStride ?? componentBytes;
  const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const end = start + Math.max(0, accessor.count - 1) * stride + componentBytes;

  if (stride < componentBytes || end > binary.byteLength) throw new Error('GLB index payload is truncated');

  const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
  const output = new Uint32Array(accessor.count);

  for (let index = 0; index < accessor.count; index += 1) {
    const offset = start + index * stride;

    output[index] =
      accessor.componentType === 5121
        ? view.getUint8(offset)
        : accessor.componentType === 5123
          ? view.getUint16(offset, true)
          : view.getUint32(offset, true);
  }

  return output;
};

export interface GlbPrimitiveKinds {
  hasPoints: boolean;
  hasTriangles: boolean;
}

/** Inspect the renderable geometry so a generic GLB import can choose point-cloud or mesh handling. */
export const getGlbPrimitiveKinds = (buffer: ArrayBuffer): GlbPrimitiveKinds => {
  const { json } = parseGlbChunks(buffer);
  const result: GlbPrimitiveKinds = { hasPoints: false, hasTriangles: false };

  visitPrimitives(json, (primitive) => {
    if (primitive.attributes?.POSITION === undefined) return;

    const mode = primitive.mode ?? TRIANGLES_MODE;

    if (mode === POINTS_MODE) result.hasPoints = true;
    else if (mode === TRIANGLES_MODE) result.hasTriangles = true;
  });

  return result;
};

/** Extract world-space POSITION accessors from the GLB point-cloud output used by MapAnything. */
export const parseGlbPositions = (buffer: ArrayBuffer): Float32Array => {
  const { binary, json } = parseGlbChunks(buffer);
  const pointPrimitives: Array<{ accessorIndex: number; matrix: Matrix4 }> = [];
  const output: number[] = [];

  visitPrimitives(json, (primitive, matrix) => {
    if (primitive.mode === POINTS_MODE && primitive.attributes?.POSITION !== undefined) {
      pointPrimitives.push({ accessorIndex: primitive.attributes.POSITION, matrix });
    }
  });

  pointPrimitives.forEach(({ accessorIndex, matrix }) => {
    const positions = readPositionAccessor(binary, json, accessorIndex, matrix);

    positions.forEach((value) => output.push(value));
  });

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

/** Extract and proportionally scale the primary triangle surface from a captured GLB mesh. */
export const parseGlbMeshGeometry = (
  buffer: ArrayBuffer,
  options: PointCloudConversionOptions = {},
): BufferGeometry => {
  const { binary, json } = parseGlbChunks(buffer);
  const { accessors = [] } = json;
  const candidates: Array<{ matrix: Matrix4; primitive: GlbPrimitive; triangleCount: number }> = [];

  visitPrimitives(json, (primitive, matrix) => {
    if ((primitive.mode ?? TRIANGLES_MODE) !== TRIANGLES_MODE || primitive.attributes?.POSITION === undefined) return;

    const count =
      primitive.indices === undefined
        ? (accessors[primitive.attributes.POSITION]?.count ?? 0)
        : (accessors[primitive.indices]?.count ?? 0);

    candidates.push({ matrix, primitive, triangleCount: Math.floor(count / 3) });
  });

  const selected = candidates.sort((first, second) => second.triangleCount - first.triangleCount)[0];

  if (!selected || selected.triangleCount <= 0 || selected.primitive.attributes?.POSITION === undefined) {
    throw new Error('GLB contains no triangle surface');
  }

  const positions = readPositionAccessor(binary, json, selected.primitive.attributes.POSITION, selected.matrix);
  const sourceIndices =
    selected.primitive.indices === undefined
      ? Uint32Array.from({ length: selected.triangleCount * 3 }, (_, index) => index)
      : readIndexAccessor(binary, json, selected.primitive.indices);
  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  let far = -Infinity;

  for (let offset = 0; offset < positions.length; offset += 3) {
    const horizontal = positions[offset];
    const vertical = positions[offset + 1];
    const depth = -positions[offset + 2];

    if (!Number.isFinite(horizontal) || !Number.isFinite(vertical) || !Number.isFinite(depth)) {
      throw new TypeError('GLB mesh contains non-finite positions');
    }

    left = Math.min(left, horizontal);
    right = Math.max(right, horizontal);
    bottom = Math.min(bottom, vertical);
    top = Math.max(top, vertical);
    far = Math.max(far, depth);
  }

  const widthMm = options.widthMm ?? DEFAULT_WIDTH_MM;

  if (!(right > left) || !(top >= bottom) || !Number.isFinite(far) || !(widthMm > 0)) {
    throw new Error('GLB mesh dimensions are invalid');
  }

  if (sourceIndices.length % 3 !== 0 || sourceIndices.some((index) => index >= positions.length / 3)) {
    throw new Error('GLB mesh indices are invalid');
  }

  const scale = widthMm / (right - left);
  const centerX = (left + right) / 2;
  const centerY = (bottom + top) / 2;
  const outputPositions = new Float32Array(positions.length);

  for (let offset = 0; offset < positions.length; offset += 3) {
    outputPositions[offset] = (positions[offset] - centerX) * scale;
    outputPositions[offset + 1] = (positions[offset + 1] - centerY) * scale;
    outputPositions[offset + 2] = (far + positions[offset + 2]) * scale;
  }

  // Flipping camera depth into Beam Studio Z changes handedness, so reverse every triangle.
  const outputIndices = new Uint32Array(sourceIndices.length);

  for (let offset = 0; offset < sourceIndices.length; offset += 3) {
    outputIndices[offset] = sourceIndices[offset];
    outputIndices[offset + 1] = sourceIndices[offset + 2];
    outputIndices[offset + 2] = sourceIndices[offset + 1];
  }

  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new Float32BufferAttribute(outputPositions, 3));
  geometry.setIndex(new Uint32BufferAttribute(outputIndices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  return geometry;
};
