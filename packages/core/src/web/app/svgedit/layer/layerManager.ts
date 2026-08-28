/**
 * SVG Layer Manager for Beam Studio
 *
 * The single mutation API for layer state. All layer reads/writes from imperative code go
 * through this class; the backing state lives in useLayerStore (a passive Zustand store) so
 * React components can subscribe to it with selectors. Never write to useLayerStore directly.
 */

import { promarkModels } from '@core/app/actions/beambox/constant';
import NS from '@core/app/constants/namespaces';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import doLayersContainsVector from '@core/helpers/layer/check-vector';
import type { HistoryActionOptions, ICommand } from '@core/interfaces/IHistory';

import { InsertElementCommand } from '../history/history';
import { handleHistoryActionOptions } from '../history/utils/handleHistoryActionOptions';

import { Layer } from './layer';

/**
 * Visible SVG elements that can be orphaned
 */
const VISIBLE_ELEMENTS = [
  'a',
  'circle',
  'ellipse',
  'foreignObject',
  'g',
  'image',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'svg',
  'text',
  'tspan',
  'use',
];

/**
 * Decide what the current layer and selection become after the layer list is rebuilt from the
 * DOM (undo/redo, external DOM mutation). Unlike identifyLayers, a resync happens on a document
 * the user is still working in, so selection should survive when it can.
 *
 * @param prevCurrentLayerName - current layer before the resync (may no longer exist)
 * @param prevSelectedLayers - selected layer names before the resync (may contain dead names)
 * @param layerNames - the rebuilt layer names, ordered bottom to top; never empty
 */
const resolveSelectionAfterResync = (
  prevCurrentLayerName: null | string,
  prevSelectedLayers: string[],
  layerNames: string[],
): { currentLayerName: null | string; selectedLayers: string[] } => {
  const selectedLayers = prevSelectedLayers.filter((name) => layerNames.includes(name));
  const currentLayerName =
    prevCurrentLayerName && layerNames.includes(prevCurrentLayerName)
      ? prevCurrentLayerName
      : (selectedLayers[0] ?? layerNames.at(-1)!);

  if (selectedLayers.length === 0) selectedLayers.push(currentLayerName);

  return { currentLayerName, selectedLayers };
};

/**
 * LayerManager class for managing SVG layers in the drawing canvas
 */
export class LayerManager {
  private svgContent: SVGSVGElement;

  /**
   * Create a new LayerManager instance
   * @param svgContent - The root SVG element
   */
  constructor(svgContent: SVGSVGElement) {
    this.svgContent = svgContent;
    this.clear();
  }

  private getState = () => useLayerStore.getState();

  /**
   * Returns the number of layers in the current drawing
   */
  public getNumLayers = (): number => {
    return this.getState().layers.length;
  };

  /**
   * Check if layer with given name already exists
   */
  public hasLayer = (name: string): boolean => {
    return this.getState().layers.some((layer) => layer.getName() === name);
  };

  /**
   * Returns the name of the ith layer. If the index is out of range, an empty string is returned.
   */
  public getLayerName = (i: number): string => {
    return this.getState().layers[i]?.getName() ?? '';
  };

  /**
   * Get all layer names
   */
  public getAllLayerNames = (): string[] => {
    return this.getState().layers.map((layer) => layer.getName());
  };

  /**
   * Returns the currently selected layer
   */
  public getCurrentLayer = (): Layer | null => {
    const { currentLayerName, layers } = this.getState();

    if (!currentLayerName) return null;

    return layers.find((layer) => layer.getName() === currentLayerName) ?? null;
  };

  /**
   * Get a layer by name
   */
  public getLayerByName = (name: string): Layer | null => {
    return this.getState().layers.find((layer) => layer.getName() === name) ?? null;
  };

  public getLayerElementByName = (name: string): null | SVGGElement => {
    const layer = this.getLayerByName(name);

    return layer ? layer.getGroup() : null;
  };

  /**
   * Returns the name of the currently selected layer
   */
  public getCurrentLayerName = (): string => {
    return this.getState().currentLayerName ?? '';
  };

  public getCurrentLayerElement = (): null | SVGGElement => {
    return this.getCurrentLayer()?.getGroup() ?? null;
  };

  /**
   * Get the selected layer names. React components should subscribe via useLayerStore instead.
   */
  public getSelectedLayers = (): string[] => {
    return this.getState().selectedLayers;
  };

  /**
   * Set the current layer's name
   */
  public setCurrentLayerName = (name: string): null | string => {
    const currentLayer = this.getCurrentLayer();

    if (!currentLayer) return null;

    const finalName = currentLayer.setName(name);

    if (finalName) {
      useLayerStore.setState({ currentLayerName: finalName, layers: [...this.getState().layers] });
    }

    return finalName;
  };

  /**
   * Remove a layer: detach its group from the DOM (emitting a history command per options) and
   * unregister it from the store, so its name is immediately free for reuse. If it was the current
   * layer, the top-most remaining layer becomes current; the removed name is also dropped from
   * the selection (falling back to the current layer), so callers need no selection cleanup.
   */
  public removeLayerByName = (name: string, options?: HistoryActionOptions): ICommand | null => {
    const layer = this.getLayerByName(name);

    if (!layer) return null;

    const cmd = layer.removeGroup(options);
    const state = this.getState();
    const layers = state.layers.filter((l) => l !== layer);

    useLayerStore.setState({
      layers,
      ...(state.currentLayerName === name && {
        currentLayerName: layers.at(-1)?.getName() ?? null,
      }),
    });
    this.setSelectedLayers(state.selectedLayers.filter((selectedName) => selectedName !== name));

    return cmd;
  };

  /**
   * Sets the current layer. Returns true if successful, false otherwise.
   */
  public setCurrentLayer = (name: string): boolean => {
    if (!this.hasLayer(name)) return false;

    useLayerStore.setState({ currentLayerName: name });

    return true;
  };

  /**
   * Set the selected layers (and the current layer, which defaults to the first selected one).
   * Recomputes the hasVector / hasGradient flags when the selection actually changes.
   */
  public setSelectedLayers = (selectedLayers: string[], currentLayer?: string): void => {
    const state = this.getState();
    const newLayers = selectedLayers.length === 0 && state.currentLayerName ? [state.currentLayerName] : selectedLayers;
    const newCurrentLayer = currentLayer || newLayers[0];

    if (newCurrentLayer && newCurrentLayer !== state.currentLayerName) {
      this.setCurrentLayer(newCurrentLayer);
    }

    // Lazy update - only update if actually different
    if (
      newLayers.length === state.selectedLayers.length &&
      newLayers.every((name, i) => name === state.selectedLayers[i])
    ) {
      return;
    }

    useLayerStore.setState({ selectedLayers: newLayers });
    this.checkVector();
    this.checkGradient();
  };

  /**
   * Recompute whether the selected layers contain vector elements. Expensive; called
   * automatically when the selection changes.
   */
  public checkVector = (): void => {
    const layers = this.getState().selectedLayers.map(this.getLayerElementByName);

    useLayerStore.setState({ hasVector: doLayersContainsVector(layers) });
  };

  /**
   * Recompute whether the selected layers contain gradient images (Promark models only).
   */
  public checkGradient = (workarea: WorkAreaModel = useDocumentStore.getState().workarea): void => {
    if (!promarkModels.has(workarea)) return;

    const hasGradient = this.getState().selectedLayers.some((layerName) =>
      Boolean(this.getLayerElementByName(layerName)?.querySelector('image[data-shading="true"]')),
    );

    useLayerStore.setState({ hasGradient });
  };

  /**
   * Find the layer name in a group element
   */
  private findLayerNameInGroup(group: SVGGElement): string {
    const titleElement = group.querySelector('title');

    return titleElement?.textContent || '';
  }

  /**
   * Find the layer color in a group element
   */
  private findLayerColorInGroup(group: SVGGElement): null | string {
    return group.getAttribute('data-color');
  }

  /**
   * Generate a new unique layer name
   */
  private getNewLayerName(existingLayerNames: string[], baseName = 'Layer'): string {
    let i = 1;

    while (existingLayerNames.includes(`${baseName} ${i}`)) {
      i++;
    }

    return `${baseName} ${i}`;
  }

  /**
   * Rebuild the Layer list from the DOM, adopting orphan elements into a new layer.
   * Always returns at least one layer.
   */
  private buildLayersFromDom(): Layer[] {
    const layers: Layer[] = [];
    const numChildren = this.svgContent.childNodes.length;
    const orphans: SVGElement[] = [];
    const layerNames: string[] = [];

    // Loop through all children of SVG element
    for (let i = 0; i < numChildren; i++) {
      const child = this.svgContent.childNodes.item(i);

      if (child && child.nodeType === Node.ELEMENT_NODE) {
        const element = child as SVGElement;

        if (element.tagName === 'g') {
          const name = this.findLayerNameInGroup(element as SVGGElement);
          const color = this.findLayerColorInGroup(element as SVGGElement);
          const isTempGroup = element.getAttribute('data-tempgroup');

          if (isTempGroup) {
            continue;
          }

          if (name) {
            // Duplicate names would make by-name lookups ambiguous; rename later occurrences
            const finalName = layerNames.includes(name) ? this.getNewLayerName(layerNames, name) : name;

            if (finalName !== name) element.querySelector('title')!.textContent = finalName;

            layerNames.push(finalName);
            layers.push(new Layer(finalName, element as SVGGElement, null, color || undefined));
          } else {
            // Group without name is an orphan
            orphans.push(element);
          }
        } else if (VISIBLE_ELEMENTS.includes(element.nodeName)) {
          // Child is visible element, so it's an orphan
          orphans.push(element);
        }
      }
    }

    // If orphans or no layers found, create a new layer and add all orphans to it
    if (orphans.length > 0 || layers.length === 0) {
      const newName = this.getNewLayerName(layerNames);
      const layer = new Layer(newName, null, this.svgContent);

      layer.appendChildren(orphans);
      layers.push(layer);
    }

    return layers;
  }

  /**
   * Updates layer system and sets the current layer to the top-most layer
   */
  public identifyLayers = (): void => {
    const layers = this.buildLayersFromDom();

    useLayerStore.setState({ currentLayerName: layers.at(-1)?.getName() ?? null, layers });
  };

  /**
   * Rebuild the layer list from the DOM while keeping the current layer and selection alive
   * where possible. Use after undo/redo or any operation that mutated layer groups behind the
   * manager's back; identifyLayers is for freshly loaded documents instead.
   */
  public resync = (): void => {
    const { currentLayerName, selectedLayers } = this.getState();
    const layers = this.buildLayersFromDom();
    const layerNames = layers.map((layer) => layer.getName());

    useLayerStore.setState({ layers, ...resolveSelectionAfterResync(currentLayerName, selectedLayers, layerNames) });
    this.checkVector();
    this.checkGradient();
  };

  /**
   * Creates a new top-level layer in the drawing with the given name
   */
  public createLayer = (name?: string, options?: HistoryActionOptions): Layer | null => {
    // Check for duplicate name or generate new one
    if (!name || name === '' || this.hasLayer(name)) {
      name = this.getNewLayerName(this.getAllLayerNames(), name || 'Layer');
    }

    // Create new layer and add to DOM as last layer
    const layer = new Layer(name, null, this.svgContent);
    const group = layer.getGroup();

    if (!group) return null;

    const cmd = new InsertElementCommand(group, `Create Layer: ${name}`);

    // Add to history
    handleHistoryActionOptions(cmd, options);

    useLayerStore.setState({ currentLayerName: name, layers: [...this.getState().layers, layer] });

    return layer;
  };

  /**
   * Returns the layer color
   */
  public getLayerColor(layerName: string): false | string {
    const layer = this.getLayerByName(layerName);

    if (!layer) return false;

    let color = layer.getColor();

    if (!color) {
      // Set default color based on layer name
      color = layerName === 'Traced Path' ? '#ff00ff' : layerName;
      layer.setColor(color);
    }

    return color;
  }

  /**
   * Returns the opacity of the given layer
   */
  public getLayerOpacity = (layerName: string): null | number => {
    const layer = this.getLayerByName(layerName);

    if (!layer) return null;

    return layer.getOpacity();
  };

  /**
   * Sets the opacity of the given layer
   */
  public setLayerOpacity = (layerName: string, opacity: number): void => {
    if (opacity < 0.0 || opacity > 1.0) return;

    this.getLayerByName(layerName)?.setOpacity(opacity);
  };

  /**
   * Get all layers
   */
  public getAllLayers = (): Layer[] => {
    return [...this.getState().layers];
  };

  /**
   * Get layer by index
   */
  public getLayerByIndex = (index: number): Layer | null => {
    return this.getState().layers[index] || null;
  };

  /**
   * Move layer to new position
   */
  public moveLayer = (fromIndex: number, toIndex: number): boolean => {
    const { layers } = this.getState();

    if (
      fromIndex < 0 ||
      fromIndex >= layers.length ||
      toIndex < 0 ||
      toIndex >= layers.length ||
      fromIndex === toIndex
    ) {
      return false;
    }

    const layer = layers[fromIndex];
    const group = layer.getGroup();

    if (!group) return false;

    const newLayers = [...layers];

    // Remove from array
    newLayers.splice(fromIndex, 1);

    // Insert at new position
    newLayers.splice(toIndex, 0, layer);

    // Update DOM order
    const targetGroup = newLayers[toIndex + 1]?.getGroup();

    if (targetGroup) {
      this.svgContent.insertBefore(group, targetGroup);
    } else {
      this.svgContent.appendChild(group);
    }

    useLayerStore.setState({ layers: newLayers });

    return true;
  };

  /**
   * Clear all layers
   */
  public clear = (): void => {
    useLayerStore.setState({ currentLayerName: null, layers: [] });
  };

  public reset = (svgContent: SVGSVGElement, identifyLayers = false): void => {
    this.clear();
    this.svgContent = svgContent;

    if (identifyLayers) this.identifyLayers();
  };
}

export const layerManager = new LayerManager(document.createElementNS(NS.SVG, 'svg'));

// Recompute the Promark gradient flag when the workarea changes
useDocumentStore.subscribe(
  (state) => state.workarea,
  (workarea) => layerManager.checkGradient(workarea),
);

export default layerManager;
