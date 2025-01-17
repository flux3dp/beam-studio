import NS from 'app/constants/namespaces';

const getRealSymbol = (elem: Element): Element | null => {
  const refId = elem.getAttributeNS(NS.XLINK, 'href');
  if(!refId?.startsWith('#')) return null;
  const refElem = document.getElementById(refId.substring(1));
  if (refElem.getAttribute('data-origin-symbol')) {
    const originalSymbol = document.getElementById(refElem.getAttribute('data-origin-symbol'));
    if (originalSymbol) return originalSymbol;
  }
  return refElem;
};

export default getRealSymbol;
