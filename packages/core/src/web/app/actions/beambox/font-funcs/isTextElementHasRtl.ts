import type * as fontkit from 'fontkit';

export const isTextElementHasRtl = (textElement: SVGTextElement, fontObj?: fontkit.Font): boolean => {
  if (!fontObj) {
    return false;
  }

  const textChildren = [...textElement.querySelectorAll('tspan'), ...textElement.querySelectorAll('textPath')];

  for (const text of textChildren) {
    const { textContent } = text;
    const { direction } = fontObj.layout(textContent!);

    if (direction === 'rtl') {
      return true;
    }
  }

  return false;
};
