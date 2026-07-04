import { defaultDockableState, useDockableStore } from './dockableStore';

describe('dockableStore', () => {
  it('should have the default state on init', () => {
    expect(useDockableStore.getState()).toEqual(defaultDockableState);
  });

  it('should initialize with a distinct clone so the exported default cannot be corrupted', () => {
    // if structuredClone is removed from the initializer, the store state IS the exported
    // defaultDockableState object, and any direct state mutation would corrupt the default
    // for every later consumer (e.g. reset flows comparing against it)
    expect(useDockableStore.getState()).not.toBe(defaultDockableState);
  });

  it('should notify selector subscribers on change', () => {
    const listener = jest.fn();
    const unsubscribe = useDockableStore.subscribe((state) => state.panelPathEdit, listener);

    useDockableStore.setState({ panelPathEdit: true });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(true, false);

    // unrelated change should not fire the selector subscription
    useDockableStore.setState({ panelObjectProperties: true });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    useDockableStore.setState({ panelPathEdit: false });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
