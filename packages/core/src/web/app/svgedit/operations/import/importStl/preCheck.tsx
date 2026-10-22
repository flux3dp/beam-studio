import type { ReactNode } from 'react';

import { sprintf } from 'sprintf-js';
import type { BufferGeometry } from 'three';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { useStlStore } from '@core/app/stores/stlStore';
import alertConfig from '@core/helpers/api/alert-config';
import i18n from '@core/helpers/i18n';

/**
 * Binary STL layout: an 80-byte header, a uint32 triangle count, then 50 bytes per triangle.
 *
 * Which makes the triangle count of a binary file computable from its size alone — no parsing, no
 * reading the whole file — and that is exactly what a pre-check wants.
 */
const BINARY_HEADER_BYTES = 84;
const BINARY_TRIANGLE_BYTES = 50;

const SIZE_WARNING_BYTES = 20 * 1024 * 1024;
const SIZE_STRONG_WARNING_BYTES = 50 * 1024 * 1024;
/**
 * The triangle counts the two size thresholds work out to for a binary STL, so the file-size limit
 * and the triangle limit mean the same thing and only one of them fires on a typical file.
 */
const TRIANGLE_WARNING = 400_000;
const TRIANGLE_STRONG_WARNING = 1_000_000;

/** Triangles in a binary STL of this size. Meaningless for an ASCII file — check the format first. */
export const estimateBinaryTriangleCount = (fileSize: number): number =>
  Math.max(0, Math.floor((fileSize - BINARY_HEADER_BYTES) / BINARY_TRIANGLE_BYTES));

/**
 * Whether the file is a binary STL, decided by its size rather than by its header.
 *
 * ⚠️ Sniffing for a leading `solid ` does **not** work: plenty of exporters write that string into
 * the 80-byte header of a binary file (the reference model this feature was built against is one of
 * them), so the text test reports ASCII for a binary file. The size arithmetic has no such
 * ambiguity — an ASCII file matching it exactly would be a coincidence of one in millions.
 */
export const isBinaryStl = (header: ArrayBuffer, fileSize: number): boolean => {
  if (header.byteLength < BINARY_HEADER_BYTES) return false;

  const triangles = new DataView(header).getUint32(80, true);

  return BINARY_HEADER_BYTES + triangles * BINARY_TRIANGLE_BYTES === fileSize;
};

const countTriangles = (geometry: BufferGeometry): number => {
  const index = geometry.getIndex();
  const count = index ? index.count : (geometry.getAttribute('position')?.count ?? 0);

  return Math.floor(count / 3);
};

/** Triangles already on the canvas. A document can hold several STL objects, and slicing pays for all of them. */
export const getSceneTriangleCount = (): number =>
  Object.values(useStlStore.getState().objects).reduce((total, { geometry }) => total + countTriangles(geometry), 0);

const askToProceed = (message: ReactNode): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    if (alertConfig.read('skip-stl-import-warning')) {
      resolve(true);

      return;
    }

    alertCaller.popUp({
      alwaysTriggerCheckboxCallbacks: false,
      buttonType: alertConstants.CONFIRM_CANCEL,
      caption: i18n.lang.beambox.popup.import_stl.title,
      checkbox: {
        callbacks: () => alertConfig.write('skip-stl-import-warning', true),
        text: i18n.lang.alert.dont_show_again,
      },
      id: 'too_large_stl',
      message,
      messageIcon: 'notice',
      onCancel: () => resolve(false),
      onConfirm: () => resolve(true),
      reverse: true,
    });
  });

/**
 * Warn before importing an STL that is going to hurt, and let the user back out.
 *
 * Everything here is decided from the file's size and its 84-byte header, so an unimportable
 * monster is caught before the app has read 35MB into memory and built a BufferGeometry from it.
 *
 * The scene total is checked as well as the file: the cost that matters is the document's, and
 * three 15MB models are the same problem as one 45MB model.
 *
 * @returns whether the import should go ahead
 */
export const performStlPreChecks = async (file: File): Promise<boolean> => {
  const t = i18n.lang.beambox.popup.import_stl;
  const warnings = Array.of<{ id: string; text: string }>();
  let strong = false;

  try {
    if (file.size > SIZE_WARNING_BYTES) {
      warnings.push({
        id: 'file_size',
        text: sprintf(
          t.file_size_warning,
          (file.size / 1024 / 1024).toFixed(1),
          (SIZE_WARNING_BYTES / 1024 / 1024).toFixed(0),
        ),
      });
      strong ||= file.size > SIZE_STRONG_WARNING_BYTES;
    }

    const header = await file.slice(0, BINARY_HEADER_BYTES).arrayBuffer();
    // an ASCII file has no cheap triangle count; it also runs 5~6x larger than the binary of the
    // same model, so the size threshold above already covers it
    const triangles = isBinaryStl(header, file.size) ? estimateBinaryTriangleCount(file.size) : 0;

    if (triangles > TRIANGLE_WARNING) {
      warnings.push({ id: 'triangles', text: sprintf(t.face_count_warning, triangles, TRIANGLE_WARNING) });
      strong ||= triangles > TRIANGLE_STRONG_WARNING;
    }

    const sceneTriangles = getSceneTriangleCount() + triangles;

    // only worth saying when the document is the problem rather than this one file
    if (sceneTriangles > TRIANGLE_WARNING && triangles <= TRIANGLE_WARNING) {
      warnings.push({
        id: 'scene_triangles',
        text: sprintf(t.scene_face_count_warning, sceneTriangles, TRIANGLE_WARNING),
      });
      strong ||= sceneTriangles > TRIANGLE_STRONG_WARNING;
    }

    if (!warnings.length) return true;

    return await askToProceed(
      <>
        <div>{t.intro_message}</div>
        {warnings.map(({ id, text }) => (
          <div key={id}>{text}</div>
        ))}
        <div>{strong ? t.advice_message_strong : t.advice_message}</div>
        <div>{t.confirmation_message}</div>
      </>,
    );
  } catch (error) {
    // a file we cannot even measure is one the loader will fail on too, but that failure is the
    // importer's to report — the pre-check only ever decides whether to stop early
    console.error('Unexpected error in performStlPreChecks:', error);

    return true;
  }
};
