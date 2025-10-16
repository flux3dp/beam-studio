const basicPaths = ['ellipse', 'line', 'path', 'polygon', 'rect'] as const;
const containers = ['g', 'use'] as const;
const fillableElems = ['ellipse', 'path', 'polygon', 'rect', 'text'] as const;

export const CanvasElements = {
  basicPaths,
  colorfulElems: [...fillableElems, 'line'] as const,
  containers,
  defElems: ['filter', 'title'] as const,
  fillableElems,
  fillableWithContainers: [...fillableElems, ...containers] as const,
  visibleElems: [...basicPaths, ...containers, 'image', 'text'] as const,
};
