import { useStampMakerPanelStore } from '.';

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
      backgroundType: 'white',
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
    expect(state.history.operations[0]).toEqual({ filter: mockFilter, isFront: undefined, mode: 'addFilter' });
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
    expect(state.history.operations[0]).toEqual({ filter: mockFilter1, isFront: undefined, mode: 'addFilter' });
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

  test('setBackgroundType', () => {
    useStampMakerPanelStore.getState().setBackgroundType('black');
    expect(useStampMakerPanelStore.getState().backgroundType).toBe('black');

    useStampMakerPanelStore.getState().setBackgroundType('white');
    expect(useStampMakerPanelStore.getState().backgroundType).toBe('white');
  });

  test('toggleInvert adds Invert filter when not present', () => {
    const state = useStampMakerPanelStore.getState();
    const invertFilter = { name: 'Invert' };

    state.toggleInvert();

    const newState = useStampMakerPanelStore.getState();

    expect(newState.filters).toContainEqual(invertFilter);
    expect(newState.backgroundType).toBe('black');
    expect(newState.history.operations).toHaveLength(1);
    expect(newState.history.operations[0]).toMatchObject({
      mode: 'invert',
      value: 'black',
    });
  });

  test('toggleInvert removes Invert filter when present', () => {
    const state = useStampMakerPanelStore.getState();
    const invertFilter = { name: 'Invert' };

    // Add invert first
    state.toggleInvert();
    expect(useStampMakerPanelStore.getState().filters).toContainEqual(invertFilter);
    expect(useStampMakerPanelStore.getState().backgroundType).toBe('black');

    // Toggle again to remove
    state.toggleInvert();

    const newState = useStampMakerPanelStore.getState();

    expect(newState.filters).not.toContainEqual(invertFilter);
    expect(newState.backgroundType).toBe('white');
    expect(newState.history.operations).toHaveLength(2);
  });

  test('toggleInvert with bevel radius updates filter type', () => {
    const state = useStampMakerPanelStore.getState();

    // Set bevel radius first
    state.setBevelRadius(2.5);
    expect(useStampMakerPanelStore.getState().filters).toContainEqual({ name: 'shrink-filter' });

    // Toggle invert - should change from shrink to expand filter
    state.toggleInvert();

    const newState = useStampMakerPanelStore.getState();

    expect(newState.backgroundType).toBe('black');
    expect(newState.filters).toContainEqual({ name: 'expand-filter' });
    expect(newState.filters).toContainEqual({ name: 'Invert' });
    expect(newState.filters).not.toContainEqual({ name: 'shrink-filter' });
  });

  test('setBevelRadius with different background types', () => {
    let state = useStampMakerPanelStore.getState();

    // Test with white background (default)
    state.setBevelRadius(2);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });
    expect(state.bevelRadius).toBe(2);

    // Change to black background
    state.setBackgroundType('black');

    // Set bevel radius with black background
    state.setBevelRadius(3);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'expand-filter' });
    expect(state.filters).not.toContainEqual({ name: 'shrink-filter' });
    expect(state.bevelRadius).toBe(3);
  });

  test('setBevelRadius removes previous bevel filter', () => {
    let state = useStampMakerPanelStore.getState();
    const otherFilter = { name: 'other-filter' } as any;

    // Add another filter and set bevel radius
    state.addFilter(otherFilter);
    state.setBevelRadius(2);

    state = useStampMakerPanelStore.getState();
    expect(state.filters).toHaveLength(2);
    expect(state.filters).toContainEqual(otherFilter);
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });

    // Change bevel radius
    state.setBevelRadius(3);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toHaveLength(2);
    expect(state.filters).toContainEqual(otherFilter);
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });
    expect(state.bevelRadius).toBe(3);
  });

  test('setBevelRadius to 0 removes bevel filter', () => {
    let state = useStampMakerPanelStore.getState();

    // Set bevel radius
    state.setBevelRadius(2);
    expect(useStampMakerPanelStore.getState().filters).toContainEqual({ name: 'shrink-filter' });

    // Set to 0
    state.setBevelRadius(0);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).not.toContainEqual({ name: 'shrink-filter' });
    expect(state.filters).toHaveLength(0);
    expect(state.bevelRadius).toBe(0);
    // Note: lastBevelRadiusFilter is set to the filter object even when bevelRadius is 0
    // This is because the filter is created but not added to the filters array
    expect(state.lastBevelRadiusFilter).toEqual({ name: 'shrink-filter' });
  });

  test('undo and redo toggleInvert', () => {
    let state = useStampMakerPanelStore.getState();

    // Toggle invert
    state.toggleInvert();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'Invert' });
    expect(state.backgroundType).toBe('black');

    // Undo
    state.undo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).not.toContainEqual({ name: 'Invert' });
    expect(state.backgroundType).toBe('white');

    // Redo
    state.redo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'Invert' });
    expect(state.backgroundType).toBe('black');
  });

  test('undo and redo setBevelRadius', () => {
    let state = useStampMakerPanelStore.getState();

    // Set bevel radius
    state.setBevelRadius(2.5);
    state = useStampMakerPanelStore.getState();
    expect(state.bevelRadius).toBe(2.5);
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });

    // Undo
    state.undo();
    state = useStampMakerPanelStore.getState();
    expect(state.bevelRadius).toBe(0);
    expect(state.filters).not.toContainEqual({ name: 'shrink-filter' });

    // Redo
    state.redo();
    state = useStampMakerPanelStore.getState();
    expect(state.bevelRadius).toBe(2.5);
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });
  });
});
