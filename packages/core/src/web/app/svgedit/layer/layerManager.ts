/**
 * SVG Layer Manager for Beam Studio
 *
 * This class manages multiple layers in an SVG drawing, extracted from the original
 * draw.js functionality. It handles layer creation, deletion, ordering, and properties.
 */

import NS from '@core/app/constants/namespaces';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { BatchCommand, InsertElementCommand, MoveElementCommand, RemoveElementCommand } from '../history/history';
import undoManager from '../history/undoManager';

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
 * LayerManager class for managing SVG layers in the drawing canvas
 */
export class LayerManager {
  private allLayers: Layer[] = [];
  private layerMap: Map<string, Layer> = new Map();
  private currentLayer: Layer | null = null;
  private svgContent: SVGSVGElement;

  /**
   * Create a new LayerManager instance
   * @param svgContent - The root SVG element
   */
  constructor(svgContent: SVGSVGElement) {
    this.svgContent = svgContent;
  }

  /**
   * Returns the number of layers in the current drawing
   */
  public getNumLayers(): number {
    return this.allLayers.length;
  }

  /**
   * Check if layer with given name already exists
   */
  public hasLayer(name: string): boolean {
    return this.layerMap.has(name);
  }

  /**
   * Returns the name of the ith layer. If the index is out of range, an empty string is returned.
   */
  public getLayerName(i: number): string {
    return i >= 0 && i < this.getNumLayers() ? this.allLayers[i].getName() : '';
  }

  /**
   * Get all layer names
   */
  public getAllLayerNames(): string[] {
    return this.allLayers.map((layer) => layer.getName());
  }

  /**
   * Returns the SVGGElement representing the current layer
   */
  public getCurrentLayer(): Layer | null {
    return this.currentLayer ?? null;
  }

  /**
   * Get a layer by name
   */
  public getLayerByName(name: string): Layer | null {
    const layer = this.layerMap.get(name);

    return layer ?? null;
  }

  public getLayerElementByName(name: string): null | SVGGElement {
    const layer = this.layerMap.get(name);

    return layer ? layer.getGroup() : null;
  }

  /**
   * Returns the name of the currently selected layer
   */
  public getCurrentLayerName(): string {
    return this.currentLayer ? this.currentLayer.getName() : '';
  }

  public getCurrentLayerElement(): null | SVGGElement {
    return this.currentLayer ? this.currentLayer.getGroup() : null;
  }

  /**
   * Set the current layer's name
   */
  public setCurrentLayerName(name: string): null | string {
    let finalName: null | string = null;

    if (this.currentLayer) {
      const oldName = this.currentLayer.getName();

      finalName = this.currentLayer.setName(name);

      if (finalName) {
        this.layerMap.delete(oldName);
        this.layerMap.set(finalName, this.currentLayer);
      }
    }

    return finalName;
  }

  /**
   * Merge current layer with the previous layer
   */
  public mergeLayer({ addToHistory = true, parentCmd }: { addToHistory?: boolean; parentCmd?: IBatchCommand }): void {
    if (!this.currentLayer) return;

    const currentGroup = this.currentLayer.getGroup();

    if (!currentGroup) return;

    const prevGroup = currentGroup.previousElementSibling as SVGGElement;

    if (!prevGroup) return;

    const batchCmd = new BatchCommand('Merge Layer');

    const layerNextSibling = currentGroup.nextSibling;

    // Move all children from current layer to previous layer
    const children = Array.from(currentGroup.childNodes);

    for (const child of children) {
      if (child instanceof Element && (child.localName === 'title' || child.tagName === 'filter')) {
        continue;
      }

      const oldNextSibling = child.nextSibling;

      prevGroup.appendChild(child);
      batchCmd.addSubCommand(new MoveElementCommand(child as SVGElement, oldNextSibling, currentGroup));
    }

    batchCmd.addSubCommand(new RemoveElementCommand(currentGroup, layerNextSibling, this.svgContent));

    // Remove current layer's group
    this.currentLayer.removeGroup();

    // Remove the current layer and set the previous layer as the new current layer
    const index = this.allLayers.indexOf(this.currentLayer);

    if (index > 0) {
      const name = this.currentLayer.getName();

      this.currentLayer = this.allLayers[index - 1];
      this.allLayers.splice(index, 1);
      this.layerMap.delete(name);
    }

    if (parentCmd) parentCmd.addSubCommand(batchCmd);
    else if (addToHistory !== false) undoManager.addCommandToHistory(batchCmd);
  }

  /**
   * Sets the current layer. Returns true if successful, false otherwise.
   */
  public setCurrentLayer(name: string): boolean {
    const layer = this.layerMap.get(name);

    if (layer) {
      this.currentLayer = layer;

      return true;
    }

    return false;
  }

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
   * Updates layer system and sets the current layer to the top-most layer
   */
  public identifyLayers(): void {
    this.allLayers = [];
    this.layerMap.clear();

    const numChildren = this.svgContent.childNodes.length;
    const orphans: SVGElement[] = [];
    const layerNames: string[] = [];
    let layer: Layer | null = null;

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
            layerNames.push(name);
            layer = new Layer(name, element as SVGGElement, null, color || undefined);
            this.allLayers.push(layer);
            this.layerMap.set(name, layer);
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
    if (orphans.length > 0 || this.allLayers.length === 0) {
      const newName = this.getNewLayerName(layerNames);

      layer = new Layer(newName, null, this.svgContent);
      layer.appendChildren(orphans);
      this.allLayers.push(layer);
      this.layerMap.set(newName, layer);
    }

    this.currentLayer = layer;
  }

  /**
   * Creates a new top-level layer in the drawing with the given name
   */
  public createLayer(
    name?: string,
    { addToHistory = true, parentCmd }: { addToHistory?: boolean; parentCmd?: IBatchCommand } = {},
  ): Layer | null {
    // Check for duplicate name or generate new one
    if (!name || name === '' || this.layerMap.has(name)) {
      name = this.getNewLayerName(Array.from(this.layerMap.keys()), name || 'Layer');
    }

    // Create new layer and add to DOM as last layer
    const layer = new Layer(name, null, this.svgContent);
    const group = layer.getGroup();

    if (!group) return null;

    const cmd = new InsertElementCommand(group, `Create Layer: ${name}`);

    // Add to history
    if (parentCmd) parentCmd.addSubCommand(cmd);
    else if (addToHistory) undoManager.addCommandToHistory(cmd);

    this.allLayers.push(layer);
    this.layerMap.set(name, layer);
    this.currentLayer = layer;

    return layer;
  }

  /**
   * Returns the layer color
   */
  public getLayerColor(layerName: string): false | string {
    const layer = this.layerMap.get(layerName);

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
  public getLayerOpacity(layerName: string): null | number {
    const layer = this.layerMap.get(layerName);

    if (!layer) return null;

    return layer.getOpacity();
  }

  /**
   * Sets the opacity of the given layer
   */
  public setLayerOpacity(layerName: string, opacity: number): void {
    if (opacity < 0.0 || opacity > 1.0) return;

    const layer = this.layerMap.get(layerName);

    if (layer) layer.setOpacity(opacity);
  }

  /**
   * Get all layers
   */
  public getAllLayers(): Layer[] {
    return [...this.allLayers];
  }

  /**
   * Get layer by index
   */
  public getLayerByIndex(index: number): Layer | null {
    return this.allLayers[index] || null;
  }

  /**
   * Move layer to new position
   */
  public moveLayer(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      fromIndex >= this.allLayers.length ||
      toIndex < 0 ||
      toIndex >= this.allLayers.length ||
      fromIndex === toIndex
    ) {
      return false;
    }

    const layer = this.allLayers[fromIndex];
    const group = layer.getGroup();

    if (!group) return false;

    // Remove from array
    this.allLayers.splice(fromIndex, 1);

    // Insert at new position
    this.allLayers.splice(toIndex, 0, layer);

    // Update DOM order
    const targetLayer = this.allLayers[toIndex + 1];
    const targetGroup = targetLayer?.getGroup();

    if (targetGroup) {
      this.svgContent.insertBefore(group, targetGroup);
    } else {
      this.svgContent.appendChild(group);
    }

    return true;
  }

  /**
   * Clear all layers
   */
  public clear(): void {
    this.allLayers = [];
    this.layerMap.clear();
    this.currentLayer = null;
  }

  public reset(svgContent: SVGSVGElement, identifyLayers = false): void {
    this.clear();
    this.svgContent = svgContent;

    if (identifyLayers) this.identifyLayers();
  }
}

export const layerManager = new LayerManager(document.createElementNS(NS.SVG, 'svg'));

export default layerManager;
