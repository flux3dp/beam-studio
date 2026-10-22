/**
 * Turn the projections from a declined Inner Engraving document into ordinary 2D elements.
 *
 * The visible SVG geometry remains useful, but none of its `data-stl*` metadata may survive: those
 * attributes are what link it to the binary mesh, photo plane, or point-cloud blocks that follow
 * the SVG in a .beam file.
 */
export const downgradeInnerEngravingElements = (root: Element): void => {
  [root, ...Array.from(root.querySelectorAll('*'))].forEach((elem) => {
    Array.from(elem.attributes).forEach(({ name }) => {
      if (name.startsWith('data-stl')) elem.removeAttribute(name);
    });
  });
};
