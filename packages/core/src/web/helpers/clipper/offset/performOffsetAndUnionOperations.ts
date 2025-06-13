import { match, P } from 'ts-pattern';

import ClipperBase from '../clipper';
import getClipperLib from '../getClipperLib';

import type { OffsetMode, Path } from './constants';
import { ARC_TOLERANCE, MITER_LIMIT, SCALE_FACTOR } from './constants';
import { processElementForOffset } from './processElementForOffset';

interface OffsetOperationResult {
  errorType?: 'processing_failed' | 'union_failed' | 'unsupported_element';
  solutionPaths: Path[];
}

export async function performOffsetAndUnionOperations(
  elementsToOffset: SVGElement[],
  mode: OffsetMode,
  distance: number,
  cornerType: 'round' | 'sharp',
): Promise<OffsetOperationResult> {
  const ClipperLib = getClipperLib();

  const delta: number = match(mode)
    .with(P.union('expand', 'outward', 'inward'), () => distance * SCALE_FACTOR)
    .with('shrink', () => -distance * SCALE_FACTOR)
    .exhaustive();

  try {
    const pathsForFinalProcessing: Path[][] = [];

    for await (const elem of elementsToOffset) {
      const offsetClipper = new ClipperBase('offset', MITER_LIMIT, ARC_TOLERANCE);

      try {
        const result = await processElementForOffset(elem, offsetClipper, ClipperLib, cornerType, mode);

        if (result.isUnsupported) return { errorType: 'unsupported_element', solutionPaths: [] };

        if (!result.success) return { errorType: 'processing_failed', solutionPaths: [] };

        const individualOffsetResult = (await offsetClipper.execute([], delta)) as Path[];

        if (mode === 'inward') {
          // For inward mode, we find the holes of THIS element and save them.
          if (individualOffsetResult.length > 1) {
            let maxArea = 0;
            let outerPathIndex = -1;

            individualOffsetResult.forEach((path, index) => {
              const area = ClipperLib.Clipper.Area(path);

              if (area > maxArea) {
                maxArea = area;
                outerPathIndex = index;
              }
            });

            if (outerPathIndex !== -1) {
              const holes = individualOffsetResult.filter((_, index) => index !== outerPathIndex);

              pathsForFinalProcessing.push(holes);
            }
          }
        } else {
          pathsForFinalProcessing.push(individualOffsetResult);
        }
      } finally {
        offsetClipper.terminate();
      }
    }

    // 2. Now, perform the final operation on the prepared paths.
    let solutionPaths: Path[] = [];
    const flattenedPaths = pathsForFinalProcessing.flat();

    await match({ flattenedPaths, mode })
      .with({ flattenedPaths: [] }, () => {})
      .with({ mode: P.union('expand', 'shrink', 'inward') }, ({ flattenedPaths }) => {
        solutionPaths = flattenedPaths;
      })
      .with({ mode: 'outward' }, async ({ flattenedPaths }) => {
        const unionClipper = new ClipperBase('clipper');
        const clipTypeUnion = ClipperLib.ClipType.ctUnion;
        const fillRule = ClipperLib.PolyFillType.pftNonZero;

        for await (const path of flattenedPaths) {
          if (solutionPaths.length === 0) {
            solutionPaths = [path];
            continue;
          }

          await unionClipper.addPaths(solutionPaths, ClipperLib.PolyType.ptSubject, true);
          await unionClipper.addPaths([path], ClipperLib.PolyType.ptClip, true);
          solutionPaths = await unionClipper.execute(clipTypeUnion, solutionPaths, fillRule, fillRule);
        }

        unionClipper.terminate();
      })
      .with({ mode: 'inward' }, async ({ flattenedPaths }) => {
        const unionClipper = new ClipperBase('clipper');

        try {
          await unionClipper.addPaths(flattenedPaths, ClipperLib.PolyType.ptSubject, true);
          solutionPaths = (await unionClipper.execute(
            ClipperLib.ClipType.ctUnion,
            new ClipperLib.Paths(),
            ClipperLib.PolyFillType.pftNonZero,
            ClipperLib.PolyFillType.pftNonZero,
          )) as Path[];
        } catch (unionError) {
          console.error('Union operation failed:', unionError);

          return { errorType: 'union_failed', solutionPaths: [] };
        } finally {
          unionClipper.terminate();
        }
      })
      .exhaustive();

    return { solutionPaths: solutionPaths.filter((path) => path?.length > 0) };
  } catch (error) {
    console.error('Clipper execution failed:', error);

    return { errorType: 'processing_failed', solutionPaths: [] };
  }
}
