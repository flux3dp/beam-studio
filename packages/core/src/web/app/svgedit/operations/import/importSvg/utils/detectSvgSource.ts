export type SvgSource = 'affinity' | 'illustrator' | 'inkscape';

const ILLUSTRATOR_NS = 'http://ns.adobe.com/AdobeIllustrator/10.0/';
const INKSCAPE_NS = 'http://www.inkscape.org/namespaces/inkscape';
const SERIF_NS = 'http://www.serif.com/';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';

/** Recognize exporter hints, not provenance. Ambiguous files deliberately have no guide. */
export const detectSvgSource = (doc: Document): SvgSource | undefined => {
  const root = doc.documentElement;

  if (root.localName !== 'svg' || doc.getElementsByTagName('parsererror').length > 0) return undefined;

  const sources = new Set<SvgSource>();
  const comments = [...Array.from(doc.childNodes), ...Array.from(root.childNodes)].filter(
    (node) => node.nodeType === Node.COMMENT_NODE,
  );

  for (const comment of comments) {
    const text = comment.textContent?.trim() ?? '';

    if (/^Generator:\s*Adobe Illustrator\b/i.test(text)) sources.add('illustrator');

    if (/^Created with Inkscape\b/i.test(text)) sources.add('inkscape');
  }

  // DOMParser resolves internal entities such as &ns_ai; before we inspect declarations.
  if (
    Array.from(root.attributes).some(
      (attribute) => attribute.namespaceURI === XMLNS_NS && attribute.value === ILLUSTRATOR_NS,
    )
  ) {
    sources.add('illustrator');
  }

  if (root.getAttributeNS(INKSCAPE_NS, 'version')?.trim()) sources.add('inkscape');

  // Serif markers identify the Affinity family; they are not exclusive to Designer.
  // Ignore namespace declarations and nested SVGs, which can be imported artwork.
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) =>
      node !== root && (node as Element).localName === 'svg' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  let element: Element | null = root;

  while (element) {
    if (Array.from(element.attributes).some((attribute) => attribute.namespaceURI === SERIF_NS)) {
      sources.add('affinity');
      break;
    }

    element = walker.nextNode() as Element | null;
  }

  return sources.size === 1 ? sources.values().next().value : undefined;
};
