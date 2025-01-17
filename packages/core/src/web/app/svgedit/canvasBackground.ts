const generatefixedSizeSvg = (dimension: number[]) => {
  const { svgedit } = window;
  const { NS } = svgedit;
  const svg = document.createElementNS(NS.SVG, 'svg');
  svg.setAttribute('id', 'fixedSizeSvg');
  svg.setAttribute('x', '0');
  svg.setAttribute('y', '0');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${dimension[0]} ${dimension[1]}`);
  return svg;
};

const setupBackground = (
  dimension: number[],
  getRoot: () => Element,
  getContent: () => Element,
): void => {
  if (document.getElementById('canvasBackground')) return;
  const { svgedit } = window;
  const { NS } = svgedit;
  const canvasBackground = document.createElementNS(NS.SVG, 'svg');
  canvasBackground.setAttribute('id', 'canvasBackground');
  canvasBackground.setAttribute('x', '0');
  canvasBackground.setAttribute('y', '0');
  canvasBackground.setAttribute('width', dimension[0].toString());
  canvasBackground.setAttribute('height', dimension[1].toString());
  // Chrome 7 has a problem with this when zooming out
  canvasBackground.setAttribute('overflow', svgedit.browser.isWebkit() ? 'none' : 'visible');

  const rect = document.createElementNS(NS.SVG, 'rect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', '#fff');
  rect.setAttribute('stroke', '#000');
  rect.setAttribute('stroke-width', '1');
  rect.setAttribute('style', 'pointer-events:none');
  rect.setAttribute('vector-effect', 'non-scaling-stroke');

  canvasBackground.appendChild(rect);
  canvasBackground.appendChild(generatefixedSizeSvg(dimension));
  getRoot().insertBefore(canvasBackground, getContent());
};

export default {
  setupBackground,
};
