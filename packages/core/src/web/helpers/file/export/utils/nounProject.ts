import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import findDefs from '@core/app/svgedit/utils/findDef';
import { getHref } from '@core/app/svgedit/utils/href';
import i18n from '@core/helpers/i18n';

export const checkNounProjectElements = (): Promise<boolean> => {
  const svgContent = document.getElementById('svgcontent')!;
  const npElements = svgContent.querySelectorAll('[data-np="1"]');

  if (npElements.length === 0) return Promise.resolve(true);

  const t = i18n.lang.noun_project_panel;

  return new Promise<boolean>((resolve) => {
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      caption: t.export_svg_title,
      id: 'export-noun-project-svg',
      message: t.export_svg_warning,
      onNo: () => resolve(false),
      onYes: () => resolve(true),
    });
  });
};

type Detached = { elem: Element; nextSibling: Node | null; parentNode: Node };

const referencedSymbolId = (use: SVGUseElement): null | string => {
  const href = getHref(use) ?? use.getAttribute('href');

  return href?.startsWith('#') ? href.slice(1) : null;
};

/** The symbol the `use` points at, plus the vector/image counterpart it is paired with. */
const symbolIdsFor = (use: SVGUseElement, defs: SVGDefsElement): string[] => {
  const id = referencedSymbolId(use);

  if (!id) return [];

  const symbol = defs.querySelector(`#${CSS.escape(id)}`);
  const paired = symbol?.getAttribute('data-origin-symbol') ?? symbol?.getAttribute('data-image-symbol');

  return paired ? [id, paired] : [id];
};

/**
 * Run `fn` with every Noun Project shape taken off the canvas, then put it all back.
 *
 * This is what `checkNounProjectElements` promises the user: shapes from the Noun Project are
 * protected artwork, so an export must not carry their vector data. Both halves matter — the
 * elements on the canvas, and the symbols in `<defs>` they draw from, which would otherwise still
 * ship the geometry with nothing referencing it. A symbol another shape still uses is left alone.
 *
 * Awaits `fn`: a synchronous wrapper would put everything back before an async `fn` reached the
 * serialization it was meant to exclude them from.
 */
export const removeNPElementsWrapper = async <T>(fn: () => Promise<T> | T): Promise<T> => {
  const svgContent = document.getElementById('svgcontent')!;
  const defs = findDefs();
  // outermost only: detaching a shape takes the nested copies inside it along
  const npElements = Array.from(svgContent.querySelectorAll('[data-np="1"]')).filter(
    (elem) => !elem.parentElement?.closest('[data-np="1"]'),
  );
  const detached: Detached[] = [];
  const detach = (elem: Element) => {
    detached.push({ elem, nextSibling: elem.nextSibling, parentNode: elem.parentNode! });
    elem.remove();
  };
  const candidateSymbolIds = new Set(
    npElements.flatMap((elem) => {
      const uses = [
        ...(elem.tagName === 'use' ? [elem as unknown as SVGUseElement] : []),
        ...Array.from(elem.querySelectorAll('use')),
      ];

      return uses.flatMap((use) => symbolIdsFor(use, defs));
    }),
  );

  npElements.forEach(detach);

  if (candidateSymbolIds.size > 0) {
    const stillReferenced = new Set(
      [...Array.from(svgContent.querySelectorAll('use')), ...Array.from(defs.querySelectorAll('use'))]
        .map(referencedSymbolId)
        .filter(Boolean) as string[],
    );

    candidateSymbolIds.forEach((id) => {
      if (stillReferenced.has(id)) return;

      const symbol = defs.querySelector(`#${CSS.escape(id)}`);

      if (symbol) detach(symbol);
    });
  }

  try {
    return await fn();
  } finally {
    for (let i = detached.length - 1; i >= 0; i--) {
      const { elem, nextSibling, parentNode } = detached[i];

      try {
        parentNode.insertBefore(elem, nextSibling);
      } catch {
        parentNode.appendChild(elem);
      }
    }
  }
};
