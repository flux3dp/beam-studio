const mockAddCommandToHistory = jest.fn();

jest.mock('../history/undoManager', () => ({
  addCommandToHistory: mockAddCommandToHistory,
}));

// Mock history functionality
jest.mock('../history/history', () => ({
  ChangeElementCommand: jest.fn(),
}));

import { Layer } from './layer';

// Mock SVG elements and DOM methods
class MockSVGElement {
  tagName: string;
  attributes: Map<string, string>;
  childNodes: MockSVGElement[];
  parentNode: MockSVGElement | null;
  textContent: string;
  ownerDocument: MockDocument;
  classList: {
    add: jest.MockedFunction<(className: string) => void>;
    contains: jest.MockedFunction<(className: string) => boolean>;
  };

  constructor(tagName: string = 'g', ownerDocument?: MockDocument) {
    this.tagName = tagName;
    this.attributes = new Map();
    this.childNodes = [];
    this.parentNode = null;
    this.textContent = '';
    this.ownerDocument = ownerDocument || new MockDocument();
    this.classList = {
      add: jest.fn((className: string) => {
        const classes = this.getAttribute('class');

        if (!classes) {
          this.setAttribute('class', className);
        } else if (!classes.split(' ').includes(className)) {
          this.setAttribute('class', `${classes} ${className}`);
        }
      }),
      contains: jest.fn((className: string) => {
        const classes = this.getAttribute('class');

        return classes?.split(' ').includes(className) || false;
      }),
    };
  }

  getAttribute(name: string): null | string {
    return this.attributes.get(name) || null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  appendChild(child: MockSVGElement): void {
    child.parentNode = this;
    this.childNodes.push(child);
  }

  removeChild(child: MockSVGElement): MockSVGElement {
    const index = this.childNodes.indexOf(child);

    if (index !== -1) {
      this.childNodes.splice(index, 1);
      child.parentNode = null;
    }

    return child;
  }

  insertBefore(newChild: MockSVGElement, referenceChild: MockSVGElement): void {
    const index = this.childNodes.indexOf(referenceChild);

    if (index !== -1) {
      newChild.parentNode = this;
      this.childNodes.splice(index, 0, newChild);
    } else {
      this.appendChild(newChild);
    }
  }

  querySelector(selector: string): MockSVGElement | null {
    for (const child of this.childNodes) {
      if (child.tagName.toLowerCase() === selector.toLowerCase()) {
        return child;
      }
    }

    return null;
  }

  remove(): void {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  get nextSibling(): MockSVGElement | null {
    if (!this.parentNode) return null;

    const index = this.parentNode.childNodes.indexOf(this);

    return this.parentNode.childNodes[index + 1] || null;
  }
}

class MockDocument {
  createElementNS(namespace: string, tagName: string): MockSVGElement {
    return new MockSVGElement(tagName, this);
  }
}

// Mock document.createTreeWalker
Object.defineProperty(global.document, 'createTreeWalker', {
  value: jest.fn().mockReturnValue({
    currentNode: null,
    nextNode: jest.fn().mockReturnValue(null),
  }),
  writable: true,
});

describe('Layer', () => {
  let mockSvgElem: MockSVGElement;
  let mockDocument: MockDocument;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocument = new MockDocument();
    mockSvgElem = new MockSVGElement('svg', mockDocument);
  });

  describe('constructor', () => {
    it('should create layer with existing group', () => {
      const existingGroup = new MockSVGElement('g', mockDocument);
      const layer = new Layer('test-layer', existingGroup as any);

      expect(layer.getName()).toBe('test-layer');
      expect(layer.getGroup()).toBe(existingGroup);
    });

    it('should create new group when svgElem is provided', () => {
      const layer = new Layer('test-layer', null, mockSvgElem as any);
      const group = layer.getGroup() as any;

      expect(group).toBeDefined();
      expect(group.tagName).toBe('g');
      expect(group.getAttribute('class')).toBe('layer');
      expect(mockSvgElem.childNodes).toContain(group);
    });

    it('should create new group after existing group when both group and svgElem provided', () => {
      const existingGroup = new MockSVGElement('g', mockDocument);
      const anotherGroup = new MockSVGElement('g', mockDocument);

      // Set up: existing group with a sibling after it
      mockSvgElem.appendChild(existingGroup);
      mockSvgElem.appendChild(anotherGroup);

      const layer = new Layer('test-layer', existingGroup as any, mockSvgElem as any);
      const group = layer.getGroup() as any;

      expect(group).toBeDefined();
      expect(group.tagName).toBe('g');

      // Verify that the new group was inserted after the existing group
      // (using insertBefore with the next sibling)
      const existingGroupIndex = mockSvgElem.childNodes.indexOf(existingGroup);
      const newGroupIndex = mockSvgElem.childNodes.indexOf(group);
      const anotherGroupIndex = mockSvgElem.childNodes.indexOf(anotherGroup);

      expect(newGroupIndex).toBe(existingGroupIndex + 1);
      expect(anotherGroupIndex).toBe(existingGroupIndex + 2);
    });

    it('should create title element with layer name', () => {
      const layer = new Layer('test-layer', null, mockSvgElem as any);
      const group = layer.getGroup() as any;
      const titleElement = group.childNodes.find((child: any) => child.tagName === 'title');

      expect(titleElement).toBeDefined();
      expect(titleElement.textContent).toBe('test-layer');
    });

    it('should set color from data-color attribute if present', () => {
      const existingGroup = new MockSVGElement('g', mockDocument);

      existingGroup.setAttribute('data-color', '#ff0000');

      const layer = new Layer('test-layer', existingGroup as any);

      expect(layer.getColor()).toBe('#ff0000');
    });

    it('should use layer name as default color if no data-color attribute', () => {
      const layer = new Layer('#00ff00', null, mockSvgElem as any);

      expect(layer.getColor()).toBe('#00ff00');
    });
  });

  describe('getName', () => {
    it('should return layer name', () => {
      const layer = new Layer('my-layer', null, mockSvgElem as any);

      expect(layer.getName()).toBe('my-layer');
    });
  });

  describe('getGroup', () => {
    it('should return the layer group element', () => {
      const layer = new Layer('test-layer', null, mockSvgElem as any);
      const group = layer.getGroup();

      expect(group).toBeDefined();
      expect((group as any).tagName).toBe('g');
    });
  });

  describe('setVisible and isVisible', () => {
    let layer: Layer;

    beforeEach(() => {
      layer = new Layer('test-layer', null, mockSvgElem as any);
    });

    it('should set layer visible', () => {
      layer.setVisible(true);

      expect(layer.isVisible()).toBe(true);
      expect((layer.getGroup() as any).getAttribute('display')).toBe('inline');
    });

    it('should set layer hidden', () => {
      layer.setVisible(false);

      expect(layer.isVisible()).toBe(false);
      expect((layer.getGroup() as any).getAttribute('display')).toBe('none');
    });

    it('should default to visible when setVisible called with undefined', () => {
      layer.setVisible(undefined);

      expect(layer.isVisible()).toBe(true);
      expect((layer.getGroup() as any).getAttribute('display')).toBe('inline');
    });

    it('should not update display if already set to expected value', () => {
      const group = layer.getGroup() as any;

      group.setAttribute('display', 'inline');

      const setAttributeSpy = jest.spyOn(group, 'setAttribute');

      layer.setVisible(true);

      expect(setAttributeSpy).not.toHaveBeenCalled();
    });
  });

  describe('getOpacity and setOpacity', () => {
    let layer: Layer;

    beforeEach(() => {
      layer = new Layer('test-layer', null, mockSvgElem as any);
    });

    it('should default opacity to 1 when not set', () => {
      expect(layer.getOpacity()).toBe(1);
    });

    it('should return set opacity value', () => {
      layer.setOpacity(0.5);

      expect(layer.getOpacity()).toBe(0.5);
      expect((layer.getGroup() as any).getAttribute('opacity')).toBe('0.5');
    });

    it('should not set opacity for invalid values', () => {
      layer.setOpacity(-0.1);
      layer.setOpacity(1.1);
      layer.setOpacity('invalid' as any);

      expect(layer.getOpacity()).toBe(1);
      expect((layer.getGroup() as any).getAttribute('opacity')).toBeNull();
    });

    it('should set opacity for boundary values', () => {
      layer.setOpacity(0);
      expect(layer.getOpacity()).toBe(0);

      layer.setOpacity(1);
      expect(layer.getOpacity()).toBe(1);
    });
  });

  describe('getColor and setColor', () => {
    let layer: Layer;

    beforeEach(() => {
      layer = new Layer('test-layer', null, mockSvgElem as any);
    });

    it('should set and get color', () => {
      layer.setColor('#ff0000');

      expect(layer.getColor()).toBe('#ff0000');
      expect((layer.getGroup() as any).getAttribute('data-color')).toBe('#ff0000');
    });

    it('should return current color from data-color attribute', () => {
      (layer.getGroup() as any).setAttribute('data-color', '#00ff00');

      expect(layer.getColor()).toBe('#00ff00');
    });
  });

  describe('setFullColor and getFullColor', () => {
    let layer: Layer;

    beforeEach(() => {
      layer = new Layer('test-layer', null, mockSvgElem as any);
    });

    it('should set full color flag to true', () => {
      layer.setFullColor(true);

      expect(layer.getFullColor()).toBe(true);
      expect((layer.getGroup() as any).getAttribute('data-fullcolor')).toBe('1');
    });

    it('should remove full color flag when set to false', () => {
      layer.setFullColor(true);
      layer.setFullColor(false);

      expect(layer.getFullColor()).toBe(false);
      expect((layer.getGroup() as any).getAttribute('data-fullcolor')).toBeNull();
    });

    it('should default to false when not set', () => {
      expect(layer.getFullColor()).toBe(false);
    });
  });

  describe('appendChildren', () => {
    let layer: Layer;

    beforeEach(() => {
      layer = new Layer('test-layer', null, mockSvgElem as any);
    });

    it('should append multiple children to layer group', () => {
      const child1 = new MockSVGElement('rect');
      const child2 = new MockSVGElement('circle');
      const children = [child1, child2] as any[];

      layer.appendChildren(children);

      const group = layer.getGroup() as any;

      expect(group.childNodes).toContain(child1);
      expect(group.childNodes).toContain(child2);
    });

    it('should handle empty children array', () => {
      expect(() => layer.appendChildren([])).not.toThrow();
    });
  });

  describe('getTitleElement', () => {
    let layer: Layer;

    beforeEach(() => {
      layer = new Layer('test-layer', null, mockSvgElem as any);
    });

    it('should return title element', () => {
      const titleElement = layer.getTitleElement();

      expect(titleElement).toBeDefined();
      expect((titleElement as any).tagName).toBe('title');
      expect((titleElement as any).textContent).toBe('test-layer');
    });

    it('should return null when no title element exists', () => {
      const group = layer.getGroup() as any;
      // Remove title element
      const titleElement = group.childNodes.find((child: any) => child.tagName === 'title');

      if (titleElement) {
        group.removeChild(titleElement);
      }

      expect(layer.getTitleElement()).toBeNull();
    });
  });

  describe('setName', () => {
    let layer: Layer;

    beforeEach(() => {
      layer = new Layer('test-layer', null, mockSvgElem as any);
      jest.clearAllMocks();
    });

    it('should set new layer name', () => {
      const newName = layer.setName('new-layer-name');

      expect(newName).toBe('new-layer-name');
      expect(layer.getName()).toBe('new-layer-name');

      const titleElement = layer.getTitleElement() as any;

      expect(titleElement.textContent).toBe('new-layer-name');
    });

    it('should create ChangeElementCommand and add to history', () => {
      const { ChangeElementCommand } = require('../history/history');
      const titleElement = layer.getTitleElement();

      layer.setName('new-layer-name');

      expect(ChangeElementCommand).toHaveBeenCalledWith(titleElement, { '#text': 'test-layer' });
      expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    });

    it('should return null when no title element exists', () => {
      const { ChangeElementCommand } = require('../history/history');
      const group = layer.getGroup() as any;
      // Remove title element
      const titleElement = group.childNodes.find((child: any) => child.tagName === 'title');

      if (titleElement) {
        group.removeChild(titleElement);
      }

      const result = layer.setName('new-name');

      expect(result).toBeNull();
      expect(ChangeElementCommand).not.toHaveBeenCalled();
      expect(mockAddCommandToHistory).not.toHaveBeenCalled();
    });
  });

  describe('removeGroup', () => {
    let layer: Layer;

    beforeEach(() => {
      layer = new Layer('test-layer', null, mockSvgElem as any);
    });

    it('should remove group from DOM and return it', () => {
      const group = layer.getGroup() as any;

      expect(mockSvgElem.childNodes).toContain(group);

      layer.removeGroup();

      expect(mockSvgElem.childNodes).not.toContain(group);
    });
  });

  describe('layer class assignment', () => {
    it('should add layer class to new group', () => {
      const layer = new Layer('test-layer', null, mockSvgElem as any);
      const group = layer.getGroup() as any;

      expect(group.getAttribute('class')).toBe('layer');
    });
  });
});
