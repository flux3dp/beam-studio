/**
 * SVG Layer Management for Beam Studio
 *
 * This class encapsulates the concept of a layer in the SVG drawing canvas.
 * Layers are represented as SVG group elements with additional metadata and functionality.
 */

import NS from '@core/app/constants/namespaces';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';

import { ChangeElementCommand, RemoveElementCommand } from '../history/history';
import undoManager from '../history/undoManager';

/**
 * Layer construction options
 */
export interface LayerOptions {
  color?: string;
  group?: null | SVGGElement;
  name: string;
  svgElem?: null | SVGElement;
}

/**
 * Add class Layer.CLASS_NAME to the element (usually class='layer').
 */
function addLayerClass(elem: SVGGElement): void {
  const classes = elem.getAttribute('class');

  if (!classes) {
    elem.setAttribute('class', Layer.CLASS_NAME);
  } else if (!elem.classList.contains(Layer.CLASS_NAME)) {
    elem.classList.add(Layer.CLASS_NAME);
  }
}

/**
 * Set pointer events inheritance for all children
 */
function setPointerEventsInheritance(elem: SVGGElement): void {
  const walker = document.createTreeWalker(elem, NodeFilter.SHOW_ELEMENT, null);

  let node: Node | null = walker.currentNode;

  while (node) {
    if (node instanceof SVGElement && node !== elem) {
      node.setAttribute('style', 'pointer-events:inherit');
    }

    node = walker.nextNode();
  }
}

/**
 * Layer class for managing SVG layers in the drawing canvas
 */
export class Layer {
  /** Class name assigned to all layer groups */
  public static readonly CLASS_NAME = 'layer';

  private name_: string;
  private group_: SVGGElement;

  /**
   * Create a new Layer instance
   *
   * @param name - Layer name
   * @param group - An existing SVG group element or null
   * @param svgElem - The SVG DOM element for adding new layers
   * @param color - Layer color (defaults to name if not provided)
   */
  constructor(name: string, group?: null | SVGGElement, svgElem?: null | SVGElement, color?: string) {
    this.name_ = name;

    if (name.match(/#[0-9A-F]{6}\b/i)) color = name; // If name is a color, use it

    if (svgElem) {
      // Create a group element with title and add it to the DOM
      const svgDoc = svgElem.ownerDocument;
      const layerTitle = svgDoc.createElementNS(NS.SVG, 'title');

      layerTitle.textContent = name;
      this.group_ = svgDoc.createElementNS(NS.SVG, 'g') as SVGGElement;
      this.group_.appendChild(layerTitle);

      // Insert the group in the correct position
      if (group) {
        // Insert after the existing group
        const nextSibling = group.nextSibling;

        if (nextSibling) {
          svgElem.insertBefore(this.group_, nextSibling);
        } else {
          svgElem.appendChild(this.group_);
        }
      } else {
        // Append as last child
        svgElem.appendChild(this.group_);
      }
    } else {
      this.group_ = group!;
    }

    if (!this.group_) {
      throw new Error('Layer group element is required');
    }

    // Check for existing color in data attribute
    const groupColor = this.group_.getAttribute('data-color');

    if (groupColor) color = groupColor;

    // Set up the layer group
    addLayerClass(this.group_);
    setPointerEventsInheritance(this.group_);

    if (color) this.setColor(color);
  }

  /**
   * Get the layer's name
   */
  public getName(): string {
    return this.name_;
  }

  /**
   * Get the group element for this layer
   */
  public getGroup(): SVGGElement {
    return this.group_;
  }

  /**
   * Set this layer visible or hidden
   */
  public setVisible(
    visible?: boolean,
    { addToHistory = true, parentCmd }: { addToHistory?: boolean; parentCmd?: IBatchCommand } = {},
  ): boolean {
    if (!this.group_) return false;

    const expected = visible === undefined || visible ? 'inline' : 'none';
    const oldDisplay = this.group_.getAttribute('display');

    if (oldDisplay === expected) return false;

    this.group_.setAttribute('display', expected);

    const command = new ChangeElementCommand(this.group_, { display: oldDisplay });

    if (parentCmd) parentCmd.addSubCommand(command);
    else if (addToHistory) undoManager.addCommandToHistory(command);

    return true;
  }

  /**
   * Check if this layer is visible
   */
  public isVisible(): boolean {
    if (!this.group_) return false;

    return this.group_.getAttribute('display') !== 'none';
  }

  /**
   * Get layer opacity
   */
  public getOpacity(): number {
    if (!this.group_) return 1;

    const opacity = this.group_.getAttribute('opacity');

    if (opacity === null || opacity === undefined) {
      return 1;
    }

    return Number.parseFloat(opacity);
  }

  /**
   * Set the opacity of this layer
   * @param opacity - A float value in the range 0.0-1.0
   */
  public setOpacity(opacity: number): void {
    if (!this.group_) return;

    if (typeof opacity === 'number' && opacity >= 0.0 && opacity <= 1.0) {
      this.group_.setAttribute('opacity', opacity.toString());
    }
  }

  /**
   * Get layer color
   */
  public getColor(): null | string {
    if (!this.group_) return null;

    return this.group_.getAttribute('data-color');
  }

  /**
   * Set the color of this layer
   */
  public setColor(color: string): void {
    if (!this.group_) return;

    this.group_.setAttribute('data-color', color);
  }

  /**
   * Set full color flag
   */
  public setFullColor(val: boolean): void {
    if (!this.group_) return;

    if (val) {
      this.group_.setAttribute('data-fullcolor', '1');
    } else {
      this.group_.removeAttribute('data-fullcolor');
    }
  }

  /**
   * Get full color flag
   */
  public getFullColor(): boolean {
    if (!this.group_) return false;

    return this.group_.getAttribute('data-fullcolor') === '1';
  }

  /**
   * Append children to this layer
   */
  public appendChildren(children: SVGElement[]): void {
    if (!this.group_) return;

    for (const child of children) {
      this.group_.appendChild(child);
    }
  }

  /**
   * Get the title element of this layer
   */
  public getTitleElement(): null | SVGTitleElement {
    if (!this.group_) return null;

    return this.group_.querySelector('title') as null | SVGTitleElement;
  }

  /**
   * Set the name of this layer
   * @param name - The new name
   * @returns The new name if changed; otherwise, null
   */
  public setName(name: string): null | string {
    const previousName = this.name_;

    // Change the underlying title element contents
    const title = this.getTitleElement();

    if (title) {
      // Clear existing content
      while (title.firstChild) {
        title.removeChild(title.firstChild);
      }

      title.textContent = name;
      this.name_ = name;

      const cmd = new ChangeElementCommand(title, { '#text': previousName });

      undoManager.addCommandToHistory(cmd);

      return this.name_;
    }

    return null;
  }

  /**
   * Remove this layer's group from the DOM
   * @returns The layer SVG group that was just removed
   */
  public removeGroup({
    addToHistory = true,
    parentCmd,
  }: { addToHistory?: boolean; parentCmd?: IBatchCommand } = {}): ICommand | null {
    if (!this.group_) return null;

    const { nextSibling, parentNode } = this.group_;

    this.group_.remove();

    const cmd = new RemoveElementCommand(this.group_, nextSibling, parentNode!);

    if (parentCmd) parentCmd.addSubCommand(cmd);
    else if (addToHistory) undoManager.addCommandToHistory(cmd);

    return cmd;
  }
}

export default Layer;
