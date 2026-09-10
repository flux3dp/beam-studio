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

/**
 * Run `fn` with Noun Project elements nested inside another Noun Project element detached, then put
 * them back.
 *
 * Awaits `fn` for the same reason as `switchSymbolWrapper`: a synchronous wrapper would restore the
 * elements before an async `fn` reached the serialization it was meant to exclude them from.
 */
export const removeNPElementsWrapper = async <T>(fn: () => Promise<T> | T): Promise<T> => {
  const svgContent = document.getElementById('svgcontent')!;
  const npElements = svgContent.querySelectorAll('[data-np="1"]');
  const removedElements = Array.of<{ elem: Element; nextSibling: Element; parentNode: Element }>();

  for (const elem of npElements) {
    const parentNode = elem.parentNode as Element;

    if (parentNode && parentNode.getAttribute('data-np') === '1') {
      const nextSibling = elem.nextSibling as Element;

      removedElements.push({ elem, nextSibling, parentNode });
      elem.remove();
    }
  }

  try {
    return await fn();
  } finally {
    for (let i = removedElements.length - 1; i >= 0; i--) {
      const { elem, nextSibling, parentNode } = removedElements[i];

      try {
        parentNode.insertBefore(elem, nextSibling);
      } catch {
        parentNode.appendChild(elem);
      }
    }
  }
};
