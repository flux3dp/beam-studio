import type { AnnotatedWorkareaModel, ModelAnnotation, WorkAreaModel } from '@core/app/constants/workarea-constants';
import { workAreaSet } from '@core/app/constants/workarea-constants';

/**
 * Encode a workarea model and its annotation into a single string.
 * e.g. ('fpm1', { fpm1: { safe: true } }) → 'fpm1_safe'
 *      ('fbb1b', {}) → 'fbb1b'
 */
export const encodeWorkareaAnnotation = (
  workarea: WorkAreaModel,
  annotation?: ModelAnnotation,
): AnnotatedWorkareaModel => {
  if (annotation) {
    const modelAnnotation = annotation[workarea as keyof ModelAnnotation];
    let result: string[] = [workarea];

    if (modelAnnotation) {
      const annotationStrings = Object.keys(modelAnnotation)
        .filter((key) => modelAnnotation[key as keyof typeof modelAnnotation])
        .sort((a, b) => a.localeCompare(b)); // sort keys to ensure consistent order

      result = result.concat(annotationStrings);
    }

    return result.join('_') as AnnotatedWorkareaModel;
  }

  return workarea;
};

/**
 * Decode a workarea string back into a workarea model and annotation.
 * e.g. 'fpm1_safe' → { workarea: 'fpm1', annotation: { fpm1: { safe: true } } }
 *      'fbb1b' → { workarea: 'fbb1b', annotation: {} }
 */
export const decodeWorkareaAnnotation = (
  value: AnnotatedWorkareaModel,
): { annotation: ModelAnnotation; workarea: WorkAreaModel } => {
  const parts = value.split('_');
  const baseWorkarea = parts[0] as WorkAreaModel;

  if (!workAreaSet.has(baseWorkarea)) {
    console.warn(`Unknown workarea model: ${baseWorkarea}`);

    return { annotation: {}, workarea: baseWorkarea };
  }

  const annotation: ModelAnnotation = {};

  for (let i = 1; i < parts.length; i++) {
    const key = parts[i];

    if (!key) continue;

    // To clear old values
    annotation[baseWorkarea as keyof ModelAnnotation] = undefined;

    if (!annotation[baseWorkarea as keyof ModelAnnotation]) {
      annotation[baseWorkarea as keyof ModelAnnotation] = {} as ModelAnnotation[keyof ModelAnnotation];
    }

    annotation[baseWorkarea as keyof ModelAnnotation]![
      key as keyof NonNullable<ModelAnnotation[keyof ModelAnnotation]>
    ] = true;
  }

  return { annotation, workarea: baseWorkarea };
};
