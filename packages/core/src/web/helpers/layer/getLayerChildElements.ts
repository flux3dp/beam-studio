// 【TODO：add tests】pure DOM logic, currently untested. Cover:
// - isRealChild: excludes def elements and data-imageborder helper rects
// - disconnected layer returns []
// - temp-group children are reintegrated at their data-next-sibling position (matches ungroupTempGroup)
// - only temp children whose data-original-layer resolves to the queried layer are reintegrated
//   (falling back to the current layer when the attribute is missing / unresolvable)
import { CanvasElements } from '@core/app/constants/canvasElements';
import layerManager from '@core/app/svgedit/layer/layerManager';

/**
 * Whether a node counts as a real first-depth child of a layer, i.e. not a
 * `<title>`/`<filter>` def element nor an image-border helper rect that the
 * temp group adds around images/uses.
 */
const isRealChild = (node: Node): node is SVGElement => {
  if (!(node instanceof SVGElement)) {
    return false;
  }

  if (CanvasElements.defElems.includes(node.localName)) {
    return false;
  }

  if (node.getAttribute('data-imageborder') === 'true') {
    return false;
  }

  return true;
};

/**
 * Resolve the layer group a temp-grouped element originally belonged to.
 * Mirrors `SelectionManager.ungroupTempGroup`: fall back to the current layer
 * when `data-original-layer` is missing or no longer resolvable.
 */
const getOriginalLayerGroup = (child: Element): null | SVGGElement => {
  const originalLayerName = child.getAttribute('data-original-layer');
  const originalLayer = originalLayerName ? layerManager.getLayerElementByName(originalLayerName) : null;

  return originalLayer || layerManager.getCurrentLayerElement();
};

/**
 * When multi-selecting, elements are temporarily moved out of their layer into
 * a `<g data-tempgroup="true">` under svgcontent. Collect the ones that came from
 * `layer`, preserving their order within each temp group.
 *
 * Scoped to a single layer on purpose: callers ask per layer, so bucketing every
 * temp child by layer would build (and throw away) the other layers' lists on each call.
 */
const collectTempChildrenOfLayer = (layer: SVGGElement): SVGElement[] => {
  const tempGroups = document.querySelectorAll<SVGGElement>('[data-tempgroup="true"]');
  const children: SVGElement[] = [];

  tempGroups.forEach((group) => {
    Array.from(group.children).forEach((child) => {
      if (!isRealChild(child)) {
        return;
      }

      if (getOriginalLayerGroup(child) === layer) {
        children.push(child);
      }
    });
  });

  return children;
};

/**
 * Insert temp-grouped elements back into their original position within a
 * layer's child list. Mirrors `ungroupTempGroup`: process from the last appended
 * child to the first, placing each before its recorded `data-next-sibling`
 * (falling back to the end of the list).
 */
const reintegrateTempChildren = (base: SVGElement[], tempChildren: SVGElement[]): SVGElement[] => {
  const result = [...base];

  for (let i = tempChildren.length - 1; i >= 0; i -= 1) {
    const child = tempChildren[i];
    const nextSiblingId = child.getAttribute('data-next-sibling');
    const index = nextSiblingId ? result.findIndex((elem) => elem.id === nextSiblingId) : -1;

    if (index >= 0) {
      result.splice(index, 0, child);
    } else {
      result.push(child);
    }
  }

  return result;
};

/**
 * Get the first-depth (direct) child elements of a single layer group.
 * Nested descendants are not included. Elements that are currently in a temp
 * group (multi-selection) are listed in their original position.
 */
export function getLayerChildElements(layer: SVGGElement): SVGElement[] {
  // Return an empty list for disconnected layers, e.g. when the layer is deleted
  if (!layer.isConnected) return [];

  const base = Array.from(layer.children).filter(isRealChild);
  const tempChildren = collectTempChildrenOfLayer(layer);

  return tempChildren.length > 0 ? reintegrateTempChildren(base, tempChildren) : base;
}

export default getLayerChildElements;
