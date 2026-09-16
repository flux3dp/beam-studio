import fontFuncs from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';

export interface TextFont {
  family: string;
  postscriptName: string;
  style: string;
}

export interface TextBounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

/**
 * Creates a <text> element with font attributes loaded and applied.
 */
const createBaseTextElement = async (
  font: TextFont,
  fontSize: number,
  letterSpacing: number,
): Promise<SVGTextElement> => {
  const text = document.createElementNS(NS.SVG, 'text');

  text.setAttribute('font-family', `'${font.family}'`);
  text.setAttribute('font-postscript', font.postscriptName);
  text.setAttributeNS(NS.XML, 'xml:space', 'preserve');

  try {
    await Promise.race([
      document.fonts.load(`${fontSize}px '${font.family}'`),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    console.error(`Fail to load ${font.family}`);
  }

  const fontDesc = fontFuncs.getFontOfPostscriptName(font.postscriptName);

  if (fontDesc) {
    text.setAttribute('font-weight', String(fontDesc.weight ?? 400));

    if (fontDesc.italic) {
      text.setAttribute('font-style', 'italic');
    }
  }

  text.setAttribute('font-size', String(fontSize));
  text.setAttribute('fill', '#000');
  text.setAttribute('text-anchor', 'middle');

  if (letterSpacing !== 0) {
    text.setAttribute('letter-spacing', String(letterSpacing));
  }

  return text;
};

/**
 * Creates an SVG <text> element with <tspan> children for multi-line text.
 */
export const createTextElement = async (
  content: string,
  font: TextFont,
  fontSize: number,
  letterSpacing: number,
  lineSpacing: number,
  bounds?: TextBounds,
): Promise<SVGTextElement> => {
  const text = await createBaseTextElement(font, fontSize, letterSpacing);

  const lines = content.split('\n');
  const lineHeight = fontSize * lineSpacing;
  const x = bounds ? bounds.x + bounds.width / 2 : 0;
  const y = bounds ? bounds.y + fontSize : fontSize;

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].trim() === '') {
      lines.pop();
    } else {
      break;
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const tspan = document.createElementNS(NS.SVG, 'tspan');

    tspan.setAttribute('x', String(x));
    tspan.textContent = lines[i];
    tspan.setAttribute('y', String(y + i * lineHeight));
    text.appendChild(tspan);
  }

  return text;
};

/**
 * Creates an invisible reference <path> (marked with data-textpath-ref) and a
 * <text><textPath> element for text-on-path.
 */
export const createTextPath = async (
  content: string,
  font: TextFont,
  fontSize: number,
  letterSpacing: number,
  pathD: string,
  pathId: string,
): Promise<{ refPath: SVGPathElement; textEl: SVGTextElement }> => {
  // Invisible reference path
  const refPath = document.createElementNS(NS.SVG, 'path');

  refPath.setAttribute('id', pathId);
  refPath.setAttribute('d', pathD);
  refPath.setAttribute('fill', 'none');
  refPath.setAttribute('stroke', 'none');
  refPath.setAttribute('data-textpath-ref', 'true');

  // Text element
  const textEl = await createBaseTextElement(font, fontSize, letterSpacing);

  // textPath child — newlines replaced with spaces since textPath is single-line
  const textPath = document.createElementNS(NS.SVG, 'textPath');

  textPath.setAttribute('href', `#${pathId}`);
  textPath.setAttribute('startOffset', '50%');
  textPath.textContent = content.replace(/\n/g, ' ');
  textEl.appendChild(textPath);

  return { refPath, textEl };
};
