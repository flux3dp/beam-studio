import { MoveElementCommand } from './history';

export const insertBefore = (
  parent: Node | null,
  elem: Element,
  ref: ChildNode | Element | null,
): MoveElementCommand | null => {
  if (!parent) return null;

  const { nextSibling } = elem;

  parent.insertBefore(elem, ref);

  return new MoveElementCommand(elem, nextSibling, parent);
};
