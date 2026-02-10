import { match, P } from 'ts-pattern';

import ClipperBase from '../clipper';
import getClipperLib from '../getClipperLib';

import { calculateResultHierarchy } from './calculateResultHierarchy';
import type { CornerType, OffsetMode, Path } from './constants';
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
  cornerType: CornerType,
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
          if (individualOffsetResult.length > 1) {
            const paths = calculateResultHierarchy(individualOffsetResult)
              .filter((item) => item.parent >= 0)
              .map((item) => item.path);

            pathsForFinalProcessing.push(paths);
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
      .exhaustive();

    return { solutionPaths: solutionPaths.filter((path) => path?.length > 0) };
  } catch (error) {
    console.error('Clipper execution failed:', error);

    return { errorType: 'processing_failed', solutionPaths: [] };
  }
}
