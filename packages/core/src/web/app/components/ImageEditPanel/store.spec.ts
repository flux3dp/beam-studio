import { useImageEditPanelStore } from './store';

describe('test ImageEditPanelStore', () => {
  beforeEach(() => {
    useImageEditPanelStore.getState().resetState();
  });

  test('initial state', () => {
    const state = useImageEditPanelStore.getState();

    expect(state).toMatchObject({
      brushSize: 20,
      cornerRadius: 0,
      currentCornerRadius: 0,
      currentLine: null,
      filters: [],
      history: { index: 0, operations: [] },
      lines: [],
      tolerance: 40,
    });
  });

  test('setBrushSize', () => {
    useImageEditPanelStore.getState().setBrushSize(30);
    expect(useImageEditPanelStore.getState().brushSize).toBe(30);
  });

  test('setTolerance', () => {
    useImageEditPanelStore.getState().setTolerance(50);
    expect(useImageEditPanelStore.getState().tolerance).toBe(50);
  });

  test('setCornerRadius not adding to history', () => {
    let state = useImageEditPanelStore.getState();

    state.setCornerRadius(10, false);

    state = useImageEditPanelStore.getState();

    expect(state.cornerRadius).toBe(10);
    expect(state.currentCornerRadius).toBe(0);
    expect(state.history.operations).toHaveLength(0);
  });

  test('setCornerRadius adding to history and undo', () => {
    let state = useImageEditPanelStore.getState();

    state.setCornerRadius(10);

    state = useImageEditPanelStore.getState();

    expect(state.cornerRadius).toBe(10);
    expect(state.currentCornerRadius).toBe(10);
    expect(state.history.index).toBe(1);
    expect(state.history.operations).toHaveLength(1);
    expect(state.history.operations[0]).toEqual({ mode: 'cornerRadius', newValue: 10, oldValue: 0 });
    state.undo();

    state = useImageEditPanelStore.getState();
    expect(state.cornerRadius).toBe(0);
    expect(state.currentCornerRadius).toBe(0);
    expect(state.history.operations).toHaveLength(1);
    expect(state.history.index).toBe(0);
  });

  test('addFilter', () => {
    let state = useImageEditPanelStore.getState();

    state.addFilter('f1' as any);
    state.addFilter('f2' as any);

    state = useImageEditPanelStore.getState();
    expect(state.filters).toHaveLength(2);
    expect(state.filters).toEqual(['f1', 'f2']);
    expect(state.history.index).toBe(2);
    expect(state.history.operations).toHaveLength(2);
    expect(state.history.operations).toEqual([
      { filter: 'f1', mode: 'magicWand' },
      { filter: 'f2', mode: 'magicWand' },
    ]);
  });

  test('filter undo / redo', () => {
    let state = useImageEditPanelStore.getState();

    state.addFilter('f1' as any);

    state = useImageEditPanelStore.getState();
    expect(state.filters).toHaveLength(1);
    expect(state.filters).toEqual(['f1']);
    expect(state.history.index).toBe(1);
    expect(state.history.operations).toHaveLength(1);
    expect(state.history.operations).toEqual([{ filter: 'f1', mode: 'magicWand' }]);
    state.undo();

    state = useImageEditPanelStore.getState();
    expect(state.filters).toHaveLength(0);
    expect(state.history.index).toBe(0);
    expect(state.history.operations).toHaveLength(1);
    expect(state.history.operations).toEqual([{ filter: 'f1', mode: 'magicWand' }]);
    state.redo();

    state = useImageEditPanelStore.getState();
    expect(state.filters).toHaveLength(1);
    expect(state.filters).toEqual(['f1']);
    expect(state.history.index).toBe(1);
    expect(state.history.operations).toHaveLength(1);
    expect(state.history.operations).toEqual([{ filter: 'f1', mode: 'magicWand' }]);
  });

  test('drawLine', () => {
    let state = useImageEditPanelStore.getState();

    state.lineStart({ points: [1, 0, 1, 0], strokeWidth: 100 });
    state = useImageEditPanelStore.getState();
    expect(state.currentLine).toEqual({ points: [1, 0, 1, 0], strokeWidth: 100 });
    expect(state.lines).toHaveLength(0);
    expect(state.history.index).toBe(0);
    expect(state.history.operations).toHaveLength(0);

    state.lineMove(2, 0);
    state = useImageEditPanelStore.getState();
    expect(state.currentLine).toEqual({ points: [1, 0, 1, 0, 2, 0], strokeWidth: 100 });
    expect(state.lines).toHaveLength(0);
    expect(state.history.index).toBe(0);
    expect(state.history.operations).toHaveLength(0);

    state.lineFinish();
    state = useImageEditPanelStore.getState();
    expect(state.currentLine).toBeNull();
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0]).toEqual({ points: [1, 0, 1, 0, 2, 0], strokeWidth: 100 });
    expect(state.history.index).toBe(1);
    expect(state.history.operations).toHaveLength(1);
    expect(state.history.operations[0]).toEqual({
      line: { points: [1, 0, 1, 0, 2, 0], strokeWidth: 100 },
      mode: 'eraser',
    });
  });

  test('line undo / redo', () => {
    let state = useImageEditPanelStore.getState();

    state.lineStart({ points: [1, 0, 1, 0], strokeWidth: 100 });
    state.lineMove(2, 0);
    state.lineFinish();

    state = useImageEditPanelStore.getState();
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0]).toEqual({ points: [1, 0, 1, 0, 2, 0], strokeWidth: 100 });
    expect(state.history.index).toBe(1);
    expect(state.history.operations).toHaveLength(1);
    expect(state.history.operations[0]).toEqual({
      line: { points: [1, 0, 1, 0, 2, 0], strokeWidth: 100 },
      mode: 'eraser',
    });

    state.undo();
    state = useImageEditPanelStore.getState();
    expect(state.lines).toHaveLength(0);
    expect(state.currentLine).toBeNull();
    expect(state.history.index).toBe(0);
    expect(state.history.operations).toHaveLength(1);

    state.redo();
    state = useImageEditPanelStore.getState();
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0]).toEqual({ points: [1, 0, 1, 0, 2, 0], strokeWidth: 100 });
    expect(state.currentLine).toBeNull();
    expect(state.history.index).toBe(1);
    expect(state.history.operations).toHaveLength(1);
  });

  test("can't redo if new operation added", () => {
    let state = useImageEditPanelStore.getState();

    state.addFilter('f1' as any);
    state.addFilter('f2' as any);
    state.undo();
    state = useImageEditPanelStore.getState();
    expect(state.filters).toHaveLength(1);
    expect(state.filters).toEqual(['f1']);
    expect(state.history.index).toBe(1);
    expect(state.history.operations).toHaveLength(2);
    expect(state.history.operations).toEqual([
      { filter: 'f1', mode: 'magicWand' },
      { filter: 'f2', mode: 'magicWand' },
    ]);

    state.addFilter('f3' as any);
    state = useImageEditPanelStore.getState();
    expect(state.filters).toHaveLength(2);
    expect(state.filters).toEqual(['f1', 'f3']);
    expect(state.history.index).toBe(2);
    expect(state.history.operations).toHaveLength(2);
    expect(state.history.operations).toEqual([
      { filter: 'f1', mode: 'magicWand' },
      { filter: 'f3', mode: 'magicWand' },
    ]);
    state.redo();
    state = useImageEditPanelStore.getState();
    expect(state.filters).toHaveLength(2);
    expect(state.filters).toEqual(['f1', 'f3']);
  });
});
