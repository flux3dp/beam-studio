import NS from '@core/app/constants/namespaces';

/**
 * convertBitmapToInfilledRect
 * simplify bitmap to infilled rect when calculating contours
 */
const convertBitmapToInfilledRect = (): (() => void) => {
  const svgcontent = document.getElementById('svgcontent');

  if (!svgcontent) {
    return () => {};
  }

  const images = svgcontent.querySelectorAll('image');
  const oldElemMap: Array<{ elem: Element; nextSibling: Node | null; parentNode: Node | null }> = [];
  const newElems: Element[] = [];

  images.forEach((elem) => {
    const rect = document.createElementNS(NS.SVG, 'rect');

    ['x', 'y', 'width', 'height', 'transform'].forEach((attr) => {
      const value = elem.getAttribute(attr);

      if (value) {
        rect.setAttribute(attr, value);
      }
    });
    rect.setAttribute('fill', '#000');
    rect.setAttribute('fill-opacity', '1');
    elem.parentNode?.appendChild(rect);
    newElems.push(rect);
    oldElemMap.unshift({ elem, nextSibling: elem.nextSibling, parentNode: elem.parentNode });
    elem.remove();
  });

  const revert = () => {
    oldElemMap.forEach(({ elem, nextSibling, parentNode }) => {
      if (nextSibling) {
        parentNode!.insertBefore(elem, nextSibling);
      } else {
        parentNode!.appendChild(elem);
      }
    });
    newElems.forEach((elem) => elem.remove());
  };

  return revert;
};

export default convertBitmapToInfilledRect;
