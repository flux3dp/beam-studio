import { detectSvgSource } from './detectSvgSource';

const detect = (svg: string) => detectSvgSource(new DOMParser().parseFromString(svg, 'image/svg+xml'));

describe('detectSvgSource', () => {
  test.each([
    ['illustrator', '<!-- Generator: Adobe Illustrator 27.8.1, SVG Export Plug-In --><svg/>'],
    ['illustrator', '<svg><!-- Generator: Adobe Illustrator 29.6.1 --><path d="M0 0"/></svg>'],
    ['illustrator', '<svg xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/"/>'],
    ['illustrator', '<svg xmlns:adobe="http://ns.adobe.com/AdobeIllustrator/10.0/"/>'],
    [
      'illustrator',
      '<!DOCTYPE svg [<!ENTITY ns_ai "http://ns.adobe.com/AdobeIllustrator/10.0/">]><svg xmlns:i="&ns_ai;"/>',
    ],
    [
      'illustrator',
      '<!DOCTYPE svg [<!ENTITY exporter "http://ns.adobe.com/AdobeIllustrator/10.0/">]><svg xmlns:adobe="&exporter;"/>',
    ],
    [
      'illustrator',
      '<!-- Generator: Adobe Illustrator 29.6.1 --><svg xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/"/>',
    ],
    ['inkscape', '<!-- Created with Inkscape (http://www.inkscape.org/) --><svg/>'],
    ['inkscape', '<svg xmlns:i="http://www.inkscape.org/namespaces/inkscape" i:version="1.4"/>'],
    ['affinity', '<svg xmlns:serif="http://www.serif.com/"><g serif:id="Layer 1"/></svg>'],
    ['affinity', '<svg xmlns:s="http://www.serif.com/" s:id="Artboard"/>'],
  ])('recognizes %s from exporter markers', (expected, svg) => {
    expect(detect(svg)).toBe(expected);
  });

  test.each([
    '<svg><path d="M0 0"/></svg>',
    '<svg xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"/>',
    '<svg xmlns:serif="http://www.serif.com/"/>',
    '<svg xmlns:i="https://example.com"/>',
    '<svg xmlns:ns_ai="https://example.com"/>',
    '<svg xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/unrelated"/>',
    '<svg data-source="http://ns.adobe.com/AdobeIllustrator/10.0/"/>',
    '<!DOCTYPE svg [<!ENTITY ns_ai "https://example.com">]><svg xmlns:i="&ns_ai;"/>',
    '<!DOCTYPE svg [<!ENTITY ns_ai "http://ns.adobe.com/AdobeIllustrator/10.0/">]><svg/>',
    '<svg xmlns:i="&ns_ai;"/>',
    '<svg><svg xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/"/></svg>',
    '<svg><g xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/"/></svg>',
    '<svg xmlns:i="https://example.com" i:version="1.4"/>',
    '<svg xmlns:i="http://www.inkscape.org/namespaces/inkscape" i:version=""/>',
    '<svg><text>Generator: Adobe Illustrator</text><g id="Affinity Designer"/><title>Inkscape</title></svg>',
    '<svg><!-- Imported artwork originally made with Adobe Illustrator --></svg>',
    '<svg><g><!-- Generator: Adobe Illustrator 29.6.1 --></g></svg>',
    '<svg><svg xmlns:i="http://www.inkscape.org/namespaces/inkscape" i:version="1.4"/></svg>',
    '<svg><svg xmlns:s="http://www.serif.com/"><g s:id="Layer"/></svg></svg>',
    '<svg><svg><!-- Created with Inkscape --></svg></svg>',
    '<html/>',
    '<svg><broken></svg>',
  ])('does not infer a source from unrelated or insufficient content: %s', (svg) => {
    expect(detect(svg)).toBeUndefined();
  });

  test.each([
    '<!-- Generator: Adobe Illustrator 27 --><svg xmlns:i="http://www.inkscape.org/namespaces/inkscape" i:version="1.4"/>',
    '<!-- Created with Inkscape --><svg xmlns:s="http://www.serif.com/"><g s:id="Layer"/></svg>',
    '<!-- Generator: Adobe Illustrator 27 --><svg xmlns:s="http://www.serif.com/" s:id="Layer"/>',
    '<!-- Created with Inkscape --><svg xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/"/>',
    '<svg xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/" xmlns:s="http://www.serif.com/" s:id="Layer"/>',
    '<svg xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/" xmlns:ink="http://www.inkscape.org/namespaces/inkscape" ink:version="1.4"/>',
  ])('omits a guide when recognized markers conflict: %s', (svg) => {
    expect(detect(svg)).toBeUndefined();
  });

  test('accepts multiple markers for the same source', () => {
    expect(
      detect(
        '<!-- Created with Inkscape --><svg xmlns:i="http://www.inkscape.org/namespaces/inkscape" i:version="1.4"/>',
      ),
    ).toBe('inkscape');
  });

  test('ignores embedded SVG markers without losing the outer source', () => {
    expect(
      detect(
        '<!-- Generator: Adobe Illustrator 27 --><svg><svg xmlns:s="http://www.serif.com/" s:id="Embedded"/></svg>',
      ),
    ).toBe('illustrator');
  });
});
