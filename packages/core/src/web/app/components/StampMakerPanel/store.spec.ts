import { useStampMakerPanelStore } from './store';

jest.mock('konva', () => ({
  Filters: {
    Invert: { name: 'Invert' },
  },
}));

jest.mock('./utils/createExpandFilter', () => ({
  createExpandFilter: jest.fn(() => ({ name: 'expand-filter' })),
}));

jest.mock('./utils/createShrinkFilter', () => ({
  createShrinkFilter: jest.fn(() => ({ name: 'shrink-filter' })),
}));

describe('test StampMakerPanelStore', () => {
  beforeEach(() => {
    useStampMakerPanelStore.getState().resetState();
  });

  test('initial state', () => {
    const state = useStampMakerPanelStore.getState();

    expect(state).toMatchObject({
      bevelRadius: 0,
      filters: [],
      history: { index: 0, operations: [] },
      horizontalFlip: false,
      lastBevelRadiusFilter: null,
    });
  });

  test('setHorizontalFlip', () => {
    useStampMakerPanelStore.getState().setHorizontalFlip(true);
    expect(useStampMakerPanelStore.getState().horizontalFlip).toBe(true);
    expect(useStampMakerPanelStore.getState().history.operations).toHaveLength(1);
    expect(useStampMakerPanelStore.getState().history.operations[0]).toEqual({ mode: 'horizontalFlip', value: true });
  });

  test('setBevelRadius', () => {
    useStampMakerPanelStore.getState().setBevelRadius(5.5);
    expect(useStampMakerPanelStore.getState().bevelRadius).toBe(5.5);
    expect(useStampMakerPanelStore.getState().history.operations).toHaveLength(1);
    expect(useStampMakerPanelStore.getState().history.operations[0]).toMatchObject({ mode: 'bevelRadius', value: 5.5 });
  });

  test('addFilter', () => {
    const mockFilter = { name: 'test-filter' } as any;

    useStampMakerPanelStore.getState().addFilter(mockFilter);

    const state = useStampMakerPanelStore.getState();

    expect(state.filters).toHaveLength(1);
    expect(state.filters[0]).toBe(mockFilter);
    expect(state.history.operations).toHaveLength(1);
    expect(state.history.operations[0]).toEqual({ filter: mockFilter, isFront: false, mode: 'addFilter' });
  });

  test('removeFilter', () => {
    const mockFilter = { name: 'test-filter' } as any;

    // Add filter first
    useStampMakerPanelStore.getState().addFilter(mockFilter);
    expect(useStampMakerPanelStore.getState().filters).toHaveLength(1);

    // Remove filter
    useStampMakerPanelStore.getState().removeFilter(mockFilter);

    const state = useStampMakerPanelStore.getState();

    expect(state.filters).toHaveLength(0);
    expect(state.history.operations).toHaveLength(2); // add + remove operations
  });

  test('undo and redo horizontal flip', () => {
    let state = useStampMakerPanelStore.getState();

    // Test horizontal flip
    state.setHorizontalFlip(true);
    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(true);
    expect(state.history.index).toBe(1);

    // Test undo
    state.undo();
    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(false);
    expect(state.history.index).toBe(0);

    // Test redo
    state.redo();
    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(true);
    expect(state.history.index).toBe(1);
  });

  test('addFilter with isFront parameter', () => {
    const mockFilter1 = { name: 'filter-1' } as any;
    const mockFilter2 = { name: 'filter-2' } as any;

    useStampMakerPanelStore.getState().addFilter(mockFilter1);
    useStampMakerPanelStore.getState().addFilter(mockFilter2, true); // Add to front

    const state = useStampMakerPanelStore.getState();

    expect(state.filters).toHaveLength(2);
    expect(state.filters[0]).toBe(mockFilter2); // Should be first due to isFront: true
    expect(state.filters[1]).toBe(mockFilter1);
    expect(state.history.operations[0]).toEqual({ filter: mockFilter1, isFront: false, mode: 'addFilter' });
    expect(state.history.operations[1]).toEqual({ filter: mockFilter2, isFront: true, mode: 'addFilter' });
  });

  test('undo and redo filter operations', () => {
    const mockFilter1 = { name: 'filter-1' } as any;
    const mockFilter2 = { name: 'filter-2' } as any;
    let state = useStampMakerPanelStore.getState();

    // Add filters
    state.addFilter(mockFilter1);
    state.addFilter(mockFilter2, true);

    state = useStampMakerPanelStore.getState();
    expect(state.filters).toEqual([mockFilter2, mockFilter1]);
    expect(state.history.index).toBe(2);

    // Undo last operation (add mockFilter2 to front)
    state.undo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toEqual([mockFilter1]);
    expect(state.history.index).toBe(1);

    // Undo first operation (add mockFilter1)
    state.undo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toEqual([]);
    expect(state.history.index).toBe(0);

    // Redo first operation
    state.redo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toEqual([mockFilter1]);
    expect(state.history.index).toBe(1);

    // Redo second operation
    state.redo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toEqual([mockFilter2, mockFilter1]);
    expect(state.history.index).toBe(2);
  });

  test('undo and redo remove filter operations', () => {
    const mockFilter = { name: 'test-filter' } as any;
    let state = useStampMakerPanelStore.getState();

    // Add and then remove filter
    state.addFilter(mockFilter);
    state.removeFilter(mockFilter);

    state = useStampMakerPanelStore.getState();
    expect(state.filters).toHaveLength(0);
    expect(state.history.operations).toHaveLength(2);
    expect(state.history.index).toBe(2);

    // Undo remove operation
    state.undo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toHaveLength(1);
    expect(state.filters[0]).toBe(mockFilter);
    expect(state.history.index).toBe(1);

    // Redo remove operation
    state.redo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toHaveLength(0);
    expect(state.history.index).toBe(2);
  });

  test('multiple operations with undo', () => {
    let state = useStampMakerPanelStore.getState();
    const mockFilter = { name: 'test-filter' } as any;

    state.setHorizontalFlip(true);
    state.addFilter(mockFilter);
    state.setBevelRadius(3.5);

    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(true);
    expect(state.filters).toHaveLength(2); // mockFilter + bevelRadius filter
    expect(state.bevelRadius).toBe(3.5);
    expect(state.history.operations).toHaveLength(3);
    expect(state.history.index).toBe(3);

    // Undo all operations
    state.undo(); // undo bevel radius
    state.undo(); // undo add filter
    state.undo(); // undo horizontal flip

    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(false);
    expect(state.filters).toHaveLength(0);
    expect(state.bevelRadius).toBe(0);
    expect(state.history.index).toBe(0);
  });
});
