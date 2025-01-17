/**
 * Get color of element
 * return color of stroke if stroke is not none
 * return color of fill if stroke is none
 * @returns color
 */
const getMainColorOfElement = (node: Element): string => {
  let color;
  color = node.getAttribute('stroke') || 'none';
  if (color === 'none') {
    color = node.getAttribute('fill');
  }
  color = color || 'rgb(0%,0%,0%)';
  return color;
};

export default getMainColorOfElement;
