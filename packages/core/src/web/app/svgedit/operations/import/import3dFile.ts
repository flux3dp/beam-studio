import type { BufferGeometry } from 'three';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { insertPointCloudGeometry, insertStlGeometry } from '@core/app/svgedit/operations/import/importStl';
import { createPointCloudGeometry, encodePointCloud } from '@core/app/svgedit/stl/pointCloud';
import i18n from '@core/helpers/i18n';
import {
  convertMapAnythingOutput,
  getGlbPrimitiveKinds,
  parseGlbMeshGeometry,
} from '@core/helpers/image/replicatePointCloud/glb';
import { exportReliefGeometry } from '@core/helpers/image/replicatePointCloud/heightField';
import { convertMoge2Output } from '@core/helpers/image/replicatePointCloud/ply';

const PROGRESS_ID = 'import-3d-file';

class Unsupported3dFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Unsupported3dFileError';
  }
}

export const THREE_D_FILE_EXTENSIONS = ['bspc', 'glb', 'ply'] as const;

type ThreeDFileExtension = (typeof THREE_D_FILE_EXTENSIONS)[number];

export type Imported3dFile =
  | { buffer: ArrayBuffer; geometry: BufferGeometry; kind: 'mesh' }
  | { buffer: ArrayBuffer; geometry: BufferGeometry; kind: 'point-cloud' };

const getThreeDFileExtension = (name: string): ThreeDFileExtension | undefined => {
  const extension = name.split('.').at(-1)?.toLowerCase();

  return THREE_D_FILE_EXTENSIONS.find((candidate) => candidate === extension);
};

export const isThreeDFileName = (name: string): boolean => Boolean(getThreeDFileExtension(name));

const createPointCloudResult = (buffer: ArrayBuffer): Imported3dFile => ({
  buffer,
  geometry: createPointCloudGeometry(buffer),
  kind: 'point-cloud',
});

const readGlbFile = (source: ArrayBuffer): Imported3dFile => {
  const { hasPoints, hasTriangles } = getGlbPrimitiveKinds(source);

  // A MapAnything point-cloud GLB can also contain triangle camera helpers. Prefer its actual
  // POINTS primitive and let the point parser discard those auxiliary meshes.
  if (hasPoints) return createPointCloudResult(encodePointCloud(convertMapAnythingOutput(source)));

  if (hasTriangles) {
    const geometry = parseGlbMeshGeometry(source);

    return { buffer: exportReliefGeometry(geometry), geometry, kind: 'mesh' };
  }

  throw new Unsupported3dFileError('GLB contains neither point nor triangle geometry');
};

/** Parse a supported provider/native 3D file into a representation accepted by Beam Studio. */
export const readThreeDFile = async (file: File): Promise<Imported3dFile> => {
  const extension = getThreeDFileExtension(file.name);

  if (!extension) throw new Error(`Unsupported 3D file: ${file.name}`);

  const source = await file.arrayBuffer();

  return match(extension)
    .with('bspc', () => createPointCloudResult(source))
    .with('glb', () => readGlbFile(source))
    .with('ply', () => createPointCloudResult(encodePointCloud(convertMoge2Output(source))))
    .exhaustive();
};

/** Import PLY/BSPC as points and automatically route a GLB to its points or triangle mesh path. */
const import3dFile = async (file: File): Promise<void> => {
  const t = i18n.lang.inner_engraving;
  let result: Imported3dFile | undefined;

  await progressCaller.openSteppingProgress({ caption: t.reading_file, id: PROGRESS_ID, percentage: 0 });

  try {
    result = await readThreeDFile(file);
    progressCaller.update(PROGRESS_ID, { caption: t.parsing_mesh, percentage: 70 });

    // Let the progress update paint before placement computes and transforms the geometry bounds.
    await new Promise((resolve) => setTimeout(resolve, 0));
  } catch (error) {
    if (!(error instanceof Unsupported3dFileError)) throw error;
  } finally {
    // Placement can ask the user whether to fit the object; never leave that prompt behind progress.
    progressCaller.popById(PROGRESS_ID);
  }

  if (!result) {
    alertCaller.popUp({
      id: 'import-unsupported-3d-file',
      message: i18n.lang.beambox.svg_editor.unnsupported_file_type,
      type: alertConstants.SHOW_POPUP_WARNING,
    });

    return;
  }

  await match(result)
    .with({ kind: 'mesh' }, ({ buffer, geometry }) => insertStlGeometry(buffer, geometry))
    .with({ kind: 'point-cloud' }, ({ buffer, geometry }) => insertPointCloudGeometry(buffer, geometry))
    .exhaustive();
};

export default import3dFile;
