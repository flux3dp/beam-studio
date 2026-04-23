import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import NS from '@core/app/constants/namespaces';
import useLayerStore from '@core/app/stores/layer/layerStore';
import updateElementColor from '@core/helpers/color/updateElementColor';
import * as LayerHelper from '@core/helpers/layer/layer-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import history from '../history/history';
import layerManager from '../layer/layerManager';
import selector from '../selector';
import { getBBox } from '../utils/getBBox';

const { svgedit } = window;

export class SelectionManager {
  private selectedElements: SVGElement[] = [];

  private tempGroup: null | SVGGElement = null;

  private selectedLayers: string[] = [];

  private svgCanvas: ISVGCanvas | null = null;

  private svgEditor: ISVGEditor | null = null;

  init(canvas: ISVGCanvas, editor: ISVGEditor): void {
    this.svgCanvas = canvas;
    this.svgEditor = editor;
  }

  // --- selectedElements accessors ---

  getSelectedElements(ungroupTempGroup = false): SVGElement[] {
    if (ungroupTempGroup && this.tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    return this.selectedElements;
  }

  setSelectedElements(elems: SVGElement[]): void {
    this.selectedElements = elems;
  }

  // --- Selection operations ---

  clearSelection = (noCall = false): void => {
    if (this.selectedElements[0]) {
      if (this.tempGroup) this.ungroupTempGroup();

      const selectorManager = selector.getSelectorManager();

      for (const element of this.selectedElements) {
        if (!element) break;

        selectorManager.releaseSelector(element);
      }

      this.selectedElements = [];

      this.svgCanvas!.collectAlignPoints();

      if (!noCall) this.svgCanvas!.call('selected', []);
    }
  };

  addToSelection = (elemsToAdd: SVGElement[], showGrips?: boolean, noCall?: boolean): void => {
    elemsToAdd = elemsToAdd.filter(Boolean);

    if (elemsToAdd.length === 0) return;

    // now add each element consecutively
    for (let i = elemsToAdd.length - 1; i >= 0; i -= 1) {
      let elem = elemsToAdd[i];

      if (!elem) {
        continue;
      }

      const bbox = getBBox(elem, { ignoreTransform: true });

      if (!bbox) {
        continue;
      }

      if (elem.tagName === 'a' && elem.childNodes.length === 1) {
        // Make "a" element's child be the selected element
        elem = elem.firstChild as SVGElement;
      }

      // if it's not already there, add it
      if (!this.selectedElements.includes(elem)) {
        this.selectedElements.push(elem);
      }
    }

    // Make sure first elements are not null
    this.selectedElements = this.selectedElements.filter(Boolean);
    this.selectedElements.sort((a, b) => (b.compareDocumentPosition(a) & 6) - 3);

    if (!noCall) {
      this.svgCanvas!.call('selected', this.selectedElements);
    }

    if (showGrips || this.selectedElements.length === 1) {
      selector.getSelectorManager().requestSelector(this.selectedElements[0])?.show(true);
    } else {
      selector.getSelectorManager().requestSelector(this.selectedElements[0])?.show(true, false);
    }

    this.svgCanvas!.collectAlignPoints();
  };

  selectOnly = (elems: SVGElement[], showGrips?: boolean): void => {
    this.clearSelection(true);
    this.addToSelection(elems, showGrips);
  };

  multiSelect = (elems: SVGElement[]): void => {
    this.clearSelection(true);
    this.addToSelection(elems, true);

    if (elems.length > 1) {
      this.tempGroupSelectedElements();
    }
  };

  removeFromSelection = (elemsToRemove: Element[], noCall?: boolean): void => {
    if (elemsToRemove.length === 0) {
      return;
    }

    const newSelectedItems = this.selectedElements.filter((element) => element && !elemsToRemove.includes(element));
    const selectorManager = selector.getSelectorManager();

    elemsToRemove.forEach((elem) => selectorManager.releaseSelector(elem));

    this.selectedElements = newSelectedItems;

    if (this.selectedElements.length === 0 && !noCall) {
      this.svgCanvas!.call('selected', this.selectedElements);
    }
  };

  // --- Predicates ---

  get isMultiSelecting(): boolean {
    return this.tempGroup !== null;
  }

  isTempGroup(elem: Element | null): boolean {
    return this.tempGroup !== null && elem === this.tempGroup;
  }

  // --- TempGroup operations ---

  tempGroupSelectedElements = (): SVGElement[] => {
    if (this.selectedElements.length <= 1) {
      return this.selectedElements;
    }

    const hasAlreadyTempGroup = this.selectedElements[0].getAttribute('data-tempgroup');
    let g: SVGGElement;

    if (hasAlreadyTempGroup) {
      g = this.selectedElements[0] as SVGGElement;
    } else {
      // create and insert the group element
      g = this.svgCanvas!.addSvgElementFromJson({
        attr: { 'data-ratiofixed': true, 'data-tempgroup': true, id: this.svgCanvas!.getNextId() },
        element: 'g',
      });

      // Move to direct under svgcontent to avoid group under invisible layer
      const svgcontent = document.getElementById('svgcontent');

      svgcontent!.appendChild(g);
    }

    // now move all children into the group
    for (let i = 0; i < this.selectedElements.length; i++) {
      if (hasAlreadyTempGroup && i === 0) {
        continue;
      }

      const elem = this.selectedElements[i];

      if (elem == null) {
        continue;
      }

      if (elem === this.tempGroup || elem.getAttribute('data-tempgroup') === 'true') {
        while (elem.childNodes.length > 0) {
          g.appendChild(elem.childNodes[0]);
        }

        elem.remove();
      } else {
        const originalLayer = LayerHelper.getObjectLayer(elem);

        if (originalLayer && originalLayer.title) {
          const title = originalLayer.title;

          elem.setAttribute('data-original-layer', title);

          if (elem.nextSibling) {
            elem.setAttribute('data-next-sibling', (elem.nextSibling as Element).id);
          }
        }

        g.appendChild(elem);
      }

      if (['image', 'use'].includes(elem.tagName)) {
        const svgdoc = document;
        const imageBorder = svgdoc.createElementNS(NS.SVG, 'rect');

        if (elem.tagName === 'image') {
          svgedit.utilities.assignAttributes(imageBorder, {
            height: elem.getAttribute('height'),
            transform: elem.getAttribute('transform') || '',
            width: elem.getAttribute('width'),
            x: elem.getAttribute('x') || 0,
            y: elem.getAttribute('y') || 0,
          });
        } else if (elem.tagName === 'use') {
          const realLocation = getBBox(elem, { ignoreTransform: true });

          svgedit.utilities.assignAttributes(imageBorder, {
            height: realLocation.height,
            transform: elem.getAttribute('transform') || '',
            width: realLocation.width,
            x: realLocation.x,
            y: realLocation.y,
          });
        }

        svgedit.utilities.assignAttributes(imageBorder, {
          'data-imageborder': true,
          fill: 'none',
          stroke: 'none',
          style: 'pointer-events:none',
          'vector-effect': 'non-scaling-stroke',
        });

        g.appendChild(imageBorder);
      }
    }

    if (hasAlreadyTempGroup) {
      this.tempGroup = null;
    }

    // update selection
    const layers = this.selectedElements
      .flatMap((elem) =>
        elem.getAttribute('data-tempgroup') === 'true' ? this.selectedLayers : LayerHelper.getObjectLayer(elem)?.title,
      )
      .filter(Boolean) as string[];

    // set the newest added layer as currentLayer
    layerManager.setCurrentLayer(layers[0]);
    // the uniq process is performed `here` to avoid duplicate layer in layer panel,
    // and remain the selected layers contains information if there are multiple elements in same layer
    useLayerStore.getState().setSelectedLayers([...new Set(layers)]);

    this.selectedLayers = layers;

    this.selectOnly([g], true);
    this.tempGroup = g;

    return [g];
  };

  removeFromTempGroup = (elem: Element): void => {
    if (!this.tempGroup || !this.tempGroup.contains(elem)) {
      return;
    }

    const originalLayerName = elem.getAttribute('data-original-layer')!;
    const originalLayer = layerManager.getLayerElementByName(originalLayerName);
    const currentLayer = layerManager.getCurrentLayerElement()!;
    const targetLayer = originalLayer || currentLayer;

    // explicitly remove one element from the temp group layers
    const idx = this.selectedLayers.indexOf(originalLayerName);

    if (idx >= 0) {
      this.selectedLayers.splice(idx, 1);
    }

    // set the current layer from the remaining layers
    layerManager.setCurrentLayer(this.selectedLayers[0]);
    useLayerStore.getState().setSelectedLayers([...new Set(this.selectedLayers)]);

    if (elem.nextSibling && (elem.nextSibling as Element).getAttribute('data-imageborder') === 'true') {
      elem.nextSibling.remove();
    }

    let nextSiblingId = elem.getAttribute('data-next-sibling');

    if (nextSiblingId) {
      nextSiblingId = nextSiblingId.replace('#', '\\#');

      const nextSibling = targetLayer.querySelector(`#${nextSiblingId}`);

      if (nextSibling) {
        targetLayer.insertBefore(elem, nextSibling);
      } else {
        targetLayer.appendChild(elem);
      }

      elem.removeAttribute('data-next-sibling');
    } else {
      targetLayer.appendChild(elem);
    }

    updateElementColor(elem);

    if (this.tempGroup.childNodes.length > 1) {
      this.svgCanvas!.selectorManager.requestSelector(this.tempGroup)?.resize();
      this.svgEditor!.updateContextPanel();
    } else if (this.tempGroup.childNodes.length === 1) {
      const lastElem = this.tempGroup.firstChild;

      this.ungroupTempGroup();
      this.selectOnly([lastElem as SVGElement], true);
    } else {
      console.warn('Removing last child from temp group. This should not happen, should find out why');
      this.ungroupTempGroup();
    }
  };

  ungroupAllTempGroup = (): void => {
    const allTempGroups = Array.from(document.querySelectorAll('[data-tempgroup="true"]'));

    allTempGroups.forEach((g) => {
      this.ungroupTempGroup(g as SVGElement);
    });
  };

  ungroupTempGroup = (elem: null | SVGElement = null): SVGElement[] => {
    const g = elem || (this.selectedElements[0] as SVGElement | undefined) || this.tempGroup;

    if (!g) {
      return [];
    }

    // Look for parent "a"
    if (g.tagName === 'g' || g.tagName === 'a') {
      const batchCmd = new history.BatchCommand('Ungroup Temp Group');
      const cmd = this.svgCanvas!.pushGroupProperties(g as SVGGElement, true);

      if (cmd) {
        batchCmd.addSubCommand(cmd);
      }

      const parent = g.parentNode;
      const children = Array.from<SVGElement>({ length: g.childNodes.length });

      let i = 0;

      while (g.lastChild) {
        const child = g.lastChild as Element;

        if (child.getAttribute('data-imageborder') === 'true') {
          child.remove();
          continue;
        }

        // Remove child title elements
        if (child.tagName === 'title') {
          child.parentNode!.removeChild(child);
          continue;
        }

        const originalLayer = layerManager.getLayerElementByName(child.getAttribute('data-original-layer')!);
        const currentLayer = layerManager.getCurrentLayerElement()!;
        const targetLayer = originalLayer || currentLayer;
        let nextSiblingId = child.getAttribute('data-next-sibling');

        if (nextSiblingId) {
          nextSiblingId = nextSiblingId.replace('#', '\\#');

          const nextSibling = targetLayer.querySelector(`#${nextSiblingId}`);

          if (nextSibling) {
            targetLayer.insertBefore(child, nextSibling);
          } else {
            targetLayer.appendChild(child);
          }

          child.removeAttribute('data-next-sibling');
        } else {
          targetLayer.appendChild(child);
        }

        updateElementColor(child as SVGElement);

        children[i++] = child as SVGElement;
      }

      if (!batchCmd.isEmpty()) {
        this.svgCanvas!.addCommandToHistory(batchCmd);
      }

      this.tempGroup = null;
      parent!.removeChild(g);
      // remove the group from the selection
      this.clearSelection();

      return children;
    }

    return [];
  };

  sortTempGroupByLayer = (): void => {
    if (!this.tempGroup) return;

    const allLayerNames = layerManager.getAllLayerNames();

    for (let i = 0; i < allLayerNames.length; i++) {
      const elems = this.tempGroup.querySelectorAll(`[data-original-layer="${allLayerNames[i]}"]`);

      for (let j = 0; j < elems.length; j++) {
        this.tempGroup.appendChild(elems[j]);
      }
    }
  };

  getElementsFromTempGroupByLayer(layerName: string): Element[] {
    if (!this.tempGroup) return [];

    return Array.from(this.tempGroup.querySelectorAll(`[data-original-layer="${layerName}"]`));
  }

  pushTempGroupProperties(): IBatchCommand | null {
    if (!this.tempGroup) return null;

    return this.svgCanvas!.pushGroupProperties(this.tempGroup as SVGGElement, true);
  }
}
