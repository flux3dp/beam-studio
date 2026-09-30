import NS from '@core/app/constants/namespaces';

const getRealSymbol = (elem: Element): Element | null => {
  const refId = elem.getAttributeNS(NS.XLINK, 'href');

  if (!refId?.startsWith('#')) {
    return null;
  }

  const refElem = document.getElementById(refId.substring(1));

  if (!refElem) return null;

  const originId = refElem.getAttribute('data-origin-symbol');

  if (originId) {
    const originalSymbol = document.getElementById(originId);

    if (originalSymbol) return originalSymbol;
  }

  return refElem;
};

export default getRealSymbol;
