const ATTRIBUTE = {
  href: 'xlink:href',
  imageSymbolId: 'data-image-symbol',
  originSymbolId: 'data-origin-symbol',
};

type UseSymbolPair = {
  image: null | SVGSymbolElement;
  origin: null | SVGSymbolElement;
};

/** Assuming given symbol is either an origin or image symbol with correct data attributes */
export const getOriginSymbol = (symbol: SVGSymbolElement): null | SVGSymbolElement => {
  const refId = symbol.getAttribute(ATTRIBUTE.originSymbolId);

  return (refId ? document.getElementById(refId) : symbol) as null | SVGSymbolElement;
};
export const getImageSymbol = (symbol: SVGSymbolElement): null | SVGSymbolElement => {
  const refId = symbol.getAttribute(ATTRIBUTE.imageSymbolId);

  return (refId ? document.getElementById(refId) : symbol) as null | SVGSymbolElement;
};

export const getSymbols = (elem: SVGUseElement): UseSymbolPair => {
  const symbols: UseSymbolPair = { image: null, origin: null };
  const refId = elem.getAttribute(ATTRIBUTE.href);

  if (!refId?.startsWith('#')) return symbols;

  const refElem = document.getElementById(refId.substring(1)) as null | SVGSymbolElement;

  if (!refElem) return symbols;

  symbols.origin = getOriginSymbol(refElem);
  symbols.image = getImageSymbol(refElem);

  return symbols;
};

export const getRealSymbol = (elem: Element): Element | null => {
  const symbols = getSymbols(elem as SVGUseElement);

  return symbols.origin ?? symbols.image;
};
