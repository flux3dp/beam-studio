export const updateSymbolStyle = (symbol: SVGSymbolElement, oldId: string) => {
  const styles = symbol.querySelectorAll('style, STYLE');

  for (let i = 0; i < styles.length; i += 1) {
    const style = styles[i];
    const { textContent } = style;

    if (!textContent) continue;

    const newContent = textContent.replace(RegExp(oldId, 'g'), symbol.id);

    style.textContent = newContent;
  }
};
