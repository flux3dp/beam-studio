import type { ILang } from '@core/interfaces/ILang';

type PuzzleGeneratorLang = ILang['puzzle_generator'];

/** Resolves a dot-notation type name key (e.g. 'types.circle_jigsaw') to a translated string */
export const resolveTypeName = (t: PuzzleGeneratorLang, nameKey: string): string => {
  const parts = nameKey.split('.');

  if (parts.length === 2 && parts[0] === 'types') {
    return t.types?.[parts[1] as keyof typeof t.types] ?? nameKey;
  }

  return nameKey;
};
