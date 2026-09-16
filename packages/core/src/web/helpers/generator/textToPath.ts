import fontFuncs, { convertTextToPathByFontkit, getFontObj } from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';

/**
 * Converts all <text> elements to <path> elements using fontkit.
 * Create a SVG temporarily mounted to the DOM for SVG position methods to work.
 * When refPaths are provided they are mounted before the text elements so
 * textPath href references resolve correctly.
 */
export const convertTextsToPath = async (
  textElements: SVGTextElement[],
  refPaths: SVGPathElement[] = [],
): Promise<SVGPathElement[]> => {
  const svg = document.createElementNS(NS.SVG, 'svg');

  // Mount to DOM so getStartPositionOfChar / getNumberOfChars work
  svg.style.visibility = 'hidden';
  svg.style.position = 'absolute';
  document.body.appendChild(svg);

  // Mount reference paths first so textPath href="#..." references resolve
  refPaths.forEach((p) => svg.appendChild(p));
  textElements.forEach((el) => svg.appendChild(el));

  const results: SVGPathElement[] = [];

  try {
    for (const textEl of textElements) {
      const postscriptName = textEl.getAttribute('font-postscript');
      const family = textEl.getAttribute('font-family') ?? '';

      let fontDesc;

      if (postscriptName) {
        fontDesc = fontFuncs.getFontOfPostscriptName(postscriptName);
      }

      if (!fontDesc) {
        if (!family) continue;

        const fonts = fontFuncs.requestFontsOfTheFontFamily(family.slice(1, -1)); // remove quotes

        if (!fonts.length) {
          console.warn(`No fonts found for family: ${family}`);
          continue;
        }

        fontDesc = fonts[0];
      }

      const fontObj = await getFontObj(fontDesc);
      const result = convertTextToPathByFontkit(textEl, fontObj, false);

      if (!result?.d) continue;

      const pathEl = document.createElementNS(NS.SVG, 'path');

      pathEl.setAttribute('d', result.d as string);
      pathEl.setAttribute('fill', textEl.getAttribute('fill') ?? '#000');

      if (result.transform) {
        pathEl.setAttribute('transform', result.transform);
      }

      textEl.replaceWith(pathEl);
      results.push(pathEl);
    }

    return results;
  } finally {
    svg.remove();
    svg.style.removeProperty('visibility');
    svg.style.removeProperty('position');
  }
};
