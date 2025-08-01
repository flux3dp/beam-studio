export const updateSymbolStyle = (symbol: SVGSymbolElement, oldId: string) => {
  for (const style of symbol.querySelectorAll('style, STYLE')) {
    const { textContent } = style;

    if (!textContent) continue;

    const newContent = textContent.replace(RegExp(oldId, 'g'), symbol.id);

    style.textContent = newContent;
  }
};
