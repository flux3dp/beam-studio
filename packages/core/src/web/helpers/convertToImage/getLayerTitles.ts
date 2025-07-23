import { getObjectLayer } from '../layer/layer-helper';

export const getLayerTitles = (svgElement: SVGElement): string[] => {
  const titles: string[] = [];
  const elements: SVGElement[] = [svgElement];
  const getLayerTitle = (element: SVGElement) => {
    if (element.tagName === 'g') {
      elements.push(...(element.children as unknown as SVGElement[]));

      return;
    }

    titles.push(getObjectLayer(element)?.title);
  };

  while (elements.length > 0) {
    const currentElement = elements.pop()!;

    getLayerTitle(currentElement);
  }

  return titles.filter(Boolean);
};
