import { match, P } from 'ts-pattern';

import ClipperBase from '../clipper';
import getClipperLib from '../getClipperLib';

import { ARC_TOLERANCE, MITER_LIMIT, type OffsetMode, type Paths, SCALE_FACTOR } from './constants';
import { processElementForOffset } from './processElementForOffset';
interface OffsetOperationResult {
  errorType?: 'processing_failed' | 'union_failed' | 'unsupported_element';
  solutionPaths: Paths;
}

export async function performOffsetAndUnionOperations(
  elementsToOffset: SVGElement[],
  mode: OffsetMode,
  distance: number,
  cornerType: 'round' | 'sharp',
): Promise<OffsetOperationResult> {
  const ClipperLib = getClipperLib();
  const offsetClipper = new ClipperBase('offset', MITER_LIMIT, ARC_TOLERANCE);
  const delta: number = match(mode)
    .with(P.union('outwardFilled', 'outwardOutline', 'inwardOutline'), () => distance * SCALE_FACTOR)
    .with(P.union('inwardFilled'), () => -distance * SCALE_FACTOR)
    .exhaustive();

  try {
    let processResult = { isUnsupported: false, success: true };

    for await (const elem of elementsToOffset) {
      const result = await processElementForOffset(elem, offsetClipper, ClipperLib, cornerType, mode);

      if (result.isUnsupported) {
        processResult.isUnsupported = true;
        break;
      }

      if (!result.success) {
        processResult.success = false;
        break;
      }
    }

    console.log(`Processed ${elementsToOffset.length} elements for offset.`, processResult);

    if (processResult.isUnsupported) {
      return { errorType: 'unsupported_element', solutionPaths: [] };
    }

    if (!processResult.success) {
      return { errorType: 'processing_failed', solutionPaths: [] };
    }

    let solutionPaths: Paths = await offsetClipper.execute([], delta);

    solutionPaths = solutionPaths.filter((path) => path?.length > 0);

    await match({ mode, solutionPaths })
      .with({ solutionPaths: [] }, () => {}) // No paths to process, do nothing
      .with({ mode: 'inwardOutline' }, () => {
        solutionPaths = solutionPaths.slice(1);
      })
      .with({ mode: 'outwardOutline' }, async () => {
        const unionClipper = new ClipperBase('clipper');
        const clipTypeUnion = ClipperLib.ClipType.ctUnion;
        const fillRule = ClipperLib.PolyFillType.pftNonZero;
        let unionedResult = [solutionPaths[0]];

        for (let i = 1; i < solutionPaths.length; i += 1) {
          await unionClipper.addPaths(unionedResult, ClipperLib.PolyType.ptSubject, true);
          await unionClipper.addPaths([solutionPaths[i]], ClipperLib.PolyType.ptClip, true);
          unionedResult = await unionClipper.execute(clipTypeUnion, unionedResult, fillRule, fillRule);
        }

        unionClipper.terminate();
        solutionPaths = unionedResult.filter((path) => path?.length > 0);
      })
      .with({ mode: 'inwardFilled' }, async () => {
        const unionClipper = new ClipperBase('clipper');

        try {
          await unionClipper.addPaths(solutionPaths, ClipperLib.PolyType.ptSubject, true);

          const clipTypeUnion = ClipperLib.ClipType.ctUnion;
          const fillRule = ClipperLib.PolyFillType.pftNonZero;
          const unionedResult = (await unionClipper.execute(
            clipTypeUnion,
            new ClipperLib.Paths(),
            fillRule,
            fillRule,
          )) as Paths;

          solutionPaths = unionedResult.filter((path) => path?.length > 0);
        } catch (unionError) {
          console.error('Union operation failed:', unionError);

          return { errorType: 'union_failed', solutionPaths: [] };
        } finally {
          unionClipper.terminate();
        }
      })
      .otherwise(() => {});

    return { solutionPaths };
  } catch (error) {
    console.error('Clipper execution failed:', error);

    return { errorType: 'processing_failed', solutionPaths: [] };
  } finally {
    offsetClipper.terminate();
  }
}
