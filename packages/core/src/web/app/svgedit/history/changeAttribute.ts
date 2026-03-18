import { ChangeElementCommand } from './history';

export const changeAttribute = (elem: Element, newAttributes: Record<string, string>): ChangeElementCommand | null => {
  const oldAttributes: Record<string, string> = {};

  for (const key in newAttributes) {
    const oldValue = elem.getAttribute(key) || '';

    if (oldValue === newAttributes[key]) {
      delete newAttributes[key];
      continue;
    }

    oldAttributes[key] = oldValue;
    elem.setAttribute(key, newAttributes[key]);
  }

  if (Object.keys(newAttributes).length === 0) {
    return null;
  }

  return new ChangeElementCommand(elem, oldAttributes);
};

export default changeAttribute;
