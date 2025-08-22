import { useStampMakerPanelStore } from './store';

describe('test ImageEditPanelStore', () => {
  beforeEach(() => {
    useStampMakerPanelStore.getState().resetState();
  });

  test('initial state', () => {
    const state = useStampMakerPanelStore.getState();

    expect(state).toMatchObject({
      history: { index: 0, operations: [] },
      horizontalFlip: false,
      invert: false,
      rampLength: 0,
    });
  });

  test('setHorizontalFlip', () => {
    useStampMakerPanelStore.getState().setHorizontalFlip(true);
    expect(useStampMakerPanelStore.getState().horizontalFlip).toBe(true);
    expect(useStampMakerPanelStore.getState().history.operations).toHaveLength(1);
    expect(useStampMakerPanelStore.getState().history.operations[0]).toEqual({
      mode: 'horizontalFlip',
      oldValue: false,
      newValue: true,
    });
  });

  test('setInvert', () => {
    useStampMakerPanelStore.getState().setInvert(true);
    expect(useStampMakerPanelStore.getState().invert).toBe(true);
    expect(useStampMakerPanelStore.getState().history.operations).toHaveLength(1);
    expect(useStampMakerPanelStore.getState().history.operations[0]).toEqual({
      mode: 'invert',
      oldValue: false,
      newValue: true,
    });
  });

  test('setRampLength', () => {
    useStampMakerPanelStore.getState().setRampLength(5.5);
    expect(useStampMakerPanelStore.getState().rampLength).toBe(5.5);
    expect(useStampMakerPanelStore.getState().history.operations).toHaveLength(1);
    expect(useStampMakerPanelStore.getState().history.operations[0]).toEqual({
      mode: 'rampLength',
      oldValue: 0,
      newValue: 5.5,
    });
  });

  test('transformation undo / redo', () => {
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

  test('multiple transformations', () => {
    let state = useStampMakerPanelStore.getState();

    state.setHorizontalFlip(true);
    state.setInvert(true);
    state.setRampLength(3.5);

    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(true);
    expect(state.invert).toBe(true);
    expect(state.rampLength).toBe(3.5);
    expect(state.history.operations).toHaveLength(3);
    expect(state.history.index).toBe(3);

    // Undo all operations
    state.undo();
    state.undo();
    state.undo();

    state = useStampMakerPanelStore.getState();
    expect(state.horizontalFlip).toBe(false);
    expect(state.invert).toBe(false);
    expect(state.rampLength).toBe(0);
    expect(state.history.index).toBe(0);
  });
});
