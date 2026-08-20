import fontFuncs, { getFontObj } from '@core/app/actions/beambox/font-funcs';
import { getWebFontBuffer } from '@core/app/actions/beambox/font-funcs.util';

/**
 * `svgStringToCanvas` renders through an <img>, an isolated document that cannot see the webfonts
 * the app has loaded into its own document, so that text would fall back to another face. Inline
 * the bytes as data uris instead. Local fonts need nothing: the isolated render resolves installed
 * families exactly like the canvas does, missing glyphs included.
 *
 * @param roots elements to scan for text; pass the same ones that get serialized into the svg
 * @returns a `<style>` element to put in the svg string, or '' when no webfont is used
 */
export const buildWebFontFaceCss = async (roots: Element[]): Promise<string> => {
  const postscriptNames = new Set(
    roots
      .flatMap((root) => [...root.querySelectorAll<SVGTextElement>('text')])
      .map((text) => text.getAttribute('font-postscript'))
      .filter(Boolean) as string[],
  );
  const faces = await Promise.all(
    [...postscriptNames].map(async (postscriptName) => {
      const font = fontFuncs.getFontOfPostscriptName(postscriptName);

      if (!font || 'path' in font) return '';

      // loading through getFontObj is what fills the buffer cache
      await getFontObj(font);

      const buffer = getWebFontBuffer(postscriptName);

      if (!buffer) return '';

      // the element's font-family attribute carries its own quotes, so name the face from the
      // resolved font instead: re-quoting the attribute would declare a family named "'Foo'"
      return `@font-face {
        font-family: ${JSON.stringify(font.family)};
        font-style: ${font.italic ? 'italic' : 'normal'};
        font-weight: ${font.weight ?? 400};
        src: url(data:font/ttf;base64,${buffer.toString('base64')});
      }`;
    }),
  );
  const css = faces.filter(Boolean).join('\n');

  return css ? `<style>${css}</style>` : '';
};

export default buildWebFontFaceCss;
