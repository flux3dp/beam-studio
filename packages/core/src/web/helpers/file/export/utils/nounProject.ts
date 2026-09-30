import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
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

/**
 * Run `fn` with every Noun Project shape taken off the canvas, then put it all back.
 *
 * This is what `checkNounProjectElements` promises the user: shapes from the Noun Project are
 * protected artwork, so an export must not carry their vector data. Noun Project imports are
 * flattened into paths before they reach the canvas, so detaching those marked paths is sufficient.
 *
 * Awaits `fn`: a synchronous wrapper would put everything back before an async `fn` reached the
 * serialization it was meant to exclude them from.
 */
export const removeNPElementsWrapper = async <T>(fn: () => Promise<T> | T): Promise<T> => {
  const svgContent = document.getElementById('svgcontent')!;
  // Keep legacy grouped scenes safe too: detaching an outer marked element takes its descendants along.
  const npElements = Array.from(svgContent.querySelectorAll('[data-np="1"]')).filter(
    (elem) => !elem.parentElement?.closest('[data-np="1"]'),
  );
  const detached: Detached[] = [];
  const detach = (elem: Element) => {
    detached.push({ elem, nextSibling: elem.nextSibling, parentNode: elem.parentNode! });
    elem.remove();
  };

  npElements.forEach(detach);

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
