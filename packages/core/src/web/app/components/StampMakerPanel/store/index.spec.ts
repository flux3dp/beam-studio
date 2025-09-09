import { useStampMakerPanelStore } from './index';

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

  test('isInverted', () => {
    let state = useStampMakerPanelStore.getState();

    // Initially should not be inverted
    expect(state.isInverted()).toBe(false);

    // Toggle invert
    state.toggleInvert();
    state = useStampMakerPanelStore.getState();
    expect(state.isInverted()).toBe(true);

    // Toggle back
    state.toggleInvert();
    state = useStampMakerPanelStore.getState();
    expect(state.isInverted()).toBe(false);
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

  test('multiple operations with undo', () => {
    let state = useStampMakerPanelStore.getState();

    state.setHorizontalFlip(true);
    state.toggleInvert();
    state.setBevelRadius(3.5);

    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(true);
    expect(state.filters).toHaveLength(2); // invert + bevelRadius filter
    expect(state.bevelRadius).toBe(3.5);
    expect(state.history.operations).toHaveLength(3);
    expect(state.history.index).toBe(3);

    // Undo all operations
    state.undo(); // undo bevel radius
    state.undo(); // undo toggle invert
    state.undo(); // undo horizontal flip

    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(false);
    expect(state.filters).toHaveLength(0);
    expect(state.bevelRadius).toBe(0); // undo handler defaults to 0 when no previous bevelRadius operation exists
    expect(state.history.index).toBe(0);
  });

  test('toggleInvert adds Invert filter when not present', () => {
    const state = useStampMakerPanelStore.getState();
    const invertFilter = { name: 'Invert' };

    state.toggleInvert();

    const newState = useStampMakerPanelStore.getState();

    expect(newState.filters).toContainEqual(invertFilter);
    expect(newState.history.operations).toHaveLength(1);
    expect(newState.history.operations[0]).toMatchObject({ mode: 'invert' });
  });

  test('toggleInvert removes Invert filter when present', () => {
    const state = useStampMakerPanelStore.getState();
    const invertFilter = { name: 'Invert' };

    // Add invert first
    state.toggleInvert();
    expect(useStampMakerPanelStore.getState().filters).toContainEqual(invertFilter);

    // Toggle again to remove
    state.toggleInvert();

    const newState = useStampMakerPanelStore.getState();

    expect(newState.filters).not.toContainEqual(invertFilter);
    expect(newState.history.operations).toHaveLength(2);
  });

  test('toggleInvert with bevel radius adds invert filter', () => {
    const state = useStampMakerPanelStore.getState();

    // Set bevel radius first
    state.setBevelRadius(2.5);
    expect(useStampMakerPanelStore.getState().filters).toContainEqual({ name: 'shrink-filter' });

    // Toggle invert - should add invert filter while keeping shrink filter
    state.toggleInvert();

    const newState = useStampMakerPanelStore.getState();

    expect(newState.filters).toContainEqual({ name: 'shrink-filter' });
    expect(newState.filters).toContainEqual({ name: 'Invert' });
  });

  test('setBevelRadius with positive and negative values', () => {
    let state = useStampMakerPanelStore.getState();

    // Test with positive value (should create shrink filter)
    state.setBevelRadius(2);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });
    expect(state.bevelRadius).toBe(2);

    // Test with another positive value (should replace previous shrink filter)
    state.setBevelRadius(3);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });
    expect(state.filters).toHaveLength(1); // Should only have one shrink filter
    expect(state.bevelRadius).toBe(3);
  });

  test('setBevelRadius removes previous bevel filter', () => {
    let state = useStampMakerPanelStore.getState();

    // Toggle invert and set bevel radius
    state.toggleInvert();
    state.setBevelRadius(2);

    state = useStampMakerPanelStore.getState();
    expect(state.filters).toHaveLength(2);
    expect(state.filters).toContainEqual({ name: 'Invert' });
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });

    // Change bevel radius
    state.setBevelRadius(3);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toHaveLength(2);
    expect(state.filters).toContainEqual({ name: 'Invert' });
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
    expect(state.lastBevelRadiusFilter).toEqual(null);
  });

  test('setBevelRadius with negative values creates expand filter', () => {
    let state = useStampMakerPanelStore.getState();

    // Test with negative value (should create expand filter)
    state.setBevelRadius(-2);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'expand-filter' });
    expect(state.bevelRadius).toBe(-2);

    // Test with another negative value (should replace previous expand filter)
    state.setBevelRadius(-3);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'expand-filter' });
    expect(state.filters).toHaveLength(1); // Should only have one expand filter
    expect(state.bevelRadius).toBe(-3);

    // Switch from negative to positive (should replace expand with shrink)
    state.setBevelRadius(2);
    state = useStampMakerPanelStore.getState();
    expect(state.filters).not.toContainEqual({ name: 'expand-filter' });
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });
    expect(state.filters).toHaveLength(1);
    expect(state.bevelRadius).toBe(2);
  });

  test('undo and redo toggleInvert', () => {
    let state = useStampMakerPanelStore.getState();

    // Toggle invert
    state.toggleInvert();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'Invert' });

    // Undo
    state.undo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).not.toContainEqual({ name: 'Invert' });

    // Redo
    state.redo();
    state = useStampMakerPanelStore.getState();
    expect(state.filters).toContainEqual({ name: 'Invert' });
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
    expect(state.bevelRadius).toBe(0); // undo handler defaults to 0 when no previous bevelRadius operation exists
    expect(state.filters).not.toContainEqual({ name: 'shrink-filter' });

    // Redo
    state.redo();
    state = useStampMakerPanelStore.getState();
    expect(state.bevelRadius).toBe(2.5);
    expect(state.filters).toContainEqual({ name: 'shrink-filter' });
  });
});
