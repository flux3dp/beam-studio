const mockIsFitText = jest.fn();

jest.mock('@core/app/svgedit/text/textedit/getters', () => ({
  isFitText: (...args: any[]) => mockIsFitText(...args),
}));

import { getDerivedData, useSelectedElementStore } from './selectedElementStore';

const makeElem = (tagName: string, attrs: Record<string, string> = {}): Element => {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, tagName);

  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));

  return el;
};

describe('selectedElementStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFitText.mockReturnValue(false);
  });

  describe('defaults', () => {
    it('should default to no selection with all capability flags off', () => {
      const state = useSelectedElementStore.getState();

      expect(state.selectedElement).toBeNull();
      expect(state.nodeType).toBe('no_selection');
      expect(state.nodeCategory).toBe('no_selection');
      expect(state.canGroup).toBe(false);
      expect(state.canUngroup).toBe(false);
      expect(state.canUngroupOrDisassemble).toBe(false);
    });
  });

  describe('getDerivedData', () => {
    it('should return the default (no-selection) data for null', () => {
      expect(getDerivedData(null)).toEqual({
        canGroup: false,
        canUngroup: false,
        canUngroupOrDisassemble: false,
        nodeCategory: 'no_selection',
        nodeType: 'no_selection',
      });
    });

    it('should classify a temp group as multi_select and groupable', () => {
      const data = getDerivedData(makeElem('g', { 'data-tempgroup': 'true' }));

      expect(data.nodeType).toBe('multi_select');
      expect(data.nodeCategory).toBe('multi_select');
      expect(data.canGroup).toBe(true);
      expect(data.canUngroup).toBe(false);
    });

    it('should map a real group to ungroupable but not groupable', () => {
      const data = getDerivedData(makeElem('g'));

      expect(data.nodeType).toBe('g');
      expect(data.canGroup).toBe(false);
      expect(data.canUngroup).toBe(true);
      expect(data.canUngroupOrDisassemble).toBe(true);
    });

    it.each([
      ['rect', 'shape'],
      ['ellipse', 'shape'],
      ['line', 'shape'],
      ['polygon', 'shape'],
    ])('should map shape tag %s to nodeCategory %s and allow grouping', (tag, category) => {
      const data = getDerivedData(makeElem(tag));

      expect(data.nodeType).toBe(tag);
      expect(data.nodeCategory).toBe(category);
      expect(data.canGroup).toBe(true);
      expect(data.canUngroup).toBe(false);
    });

    it('should treat data-textpath-g as text_path (not groupable)', () => {
      const data = getDerivedData(makeElem('g', { 'data-textpath-g': 'true' }));

      expect(data.nodeType).toBe('text_path');
      expect(data.canGroup).toBe(false);
    });

    it('should treat fit_text (via isFitText) as text category', () => {
      mockIsFitText.mockReturnValue(true);

      const data = getDerivedData(makeElem('text'));

      expect(data.nodeType).toBe('fit_text');
      expect(data.nodeCategory).toBe('text');
      expect(data.canGroup).toBe(true);
    });

    it('should treat data-pass-through as pass_through_object (not groupable)', () => {
      const data = getDerivedData(makeElem('g', { 'data-pass-through': 'true' }));

      expect(data.nodeType).toBe('pass_through_object');
      expect(data.canGroup).toBe(false);
    });

    it('should classify a use element with data-svg as svg -> use category, disassemblable', () => {
      const data = getDerivedData(makeElem('use', { 'data-svg': 'true' }));

      expect(data.nodeType).toBe('svg');
      expect(data.nodeCategory).toBe('use');
      expect(data.canUngroup).toBe(false);
      expect(data.canUngroupOrDisassemble).toBe(true);
    });

    it('should classify a use element with data-dxf as dxf -> use category, disassemblable', () => {
      const data = getDerivedData(makeElem('use', { 'data-dxf': 'true' }));

      expect(data.nodeType).toBe('dxf');
      expect(data.nodeCategory).toBe('use');
      expect(data.canUngroupOrDisassemble).toBe(true);
    });

    it('should classify a bare use element as use -> use category', () => {
      const data = getDerivedData(makeElem('use'));

      expect(data.nodeType).toBe('use');
      expect(data.nodeCategory).toBe('use');
      expect(data.canUngroupOrDisassemble).toBe(true);
    });
  });

  describe('setSelectedElement', () => {
    it('should store the element and merge in its derived data', () => {
      const rect = makeElem('rect');

      useSelectedElementStore.getState().setSelectedElement(rect);

      const state = useSelectedElementStore.getState();

      expect(state.selectedElement).toBe(rect);
      expect(state.nodeType).toBe('rect');
      expect(state.nodeCategory).toBe('shape');
      expect(state.canGroup).toBe(true);
    });

    it('should reset derived data back to defaults when cleared with null', () => {
      useSelectedElementStore.getState().setSelectedElement(makeElem('rect'));
      useSelectedElementStore.getState().setSelectedElement(null);

      const state = useSelectedElementStore.getState();

      expect(state.selectedElement).toBeNull();
      expect(state.nodeType).toBe('no_selection');
      expect(state.canGroup).toBe(false);
    });
  });

  describe('refreshState', () => {
    it('should recompute derived data from the current selectedElement', () => {
      const rect = makeElem('rect');

      // seed the element without going through setSelectedElement's derived merge
      useSelectedElementStore.setState({ selectedElement: rect });
      // stale derived flags: no_selection defaults still in place
      expect(useSelectedElementStore.getState().nodeType).toBe('no_selection');

      useSelectedElementStore.getState().refreshState();

      expect(useSelectedElementStore.getState().nodeType).toBe('rect');
      expect(useSelectedElementStore.getState().canGroup).toBe(true);
    });
  });

  describe('selection subscriber', () => {
    it('should blur the active element when the selected element changes', () => {
      const input = document.createElement('input');

      document.body.appendChild(input);
      input.focus();
      expect(document.activeElement).toBe(input);

      const blurSpy = jest.spyOn(input, 'blur');

      useSelectedElementStore.getState().setSelectedElement(makeElem('rect'));

      expect(blurSpy).toHaveBeenCalledTimes(1);

      input.remove();
    });
  });
});
