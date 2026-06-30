import { RemoveElementCommand } from './history';

export const removeElement = (elem: Element | null): null | RemoveElementCommand => {
  if (!elem) return null;

  const { nextSibling, parentNode } = elem;

  if (!parentNode) return null;

  parentNode.removeChild(elem);

  return new RemoveElementCommand(elem, nextSibling, parentNode);
};
