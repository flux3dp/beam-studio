import {
  antdScreenTokens,
  initScreenStore,
  isMobile,
  isTablet,
  isTabletOrMobile,
  useScreenStore,
} from './screenStore';

describe('screenStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('defaults', () => {
    it('should start with both isMobile and isTablet false', () => {
      expect(useScreenStore.getState()).toEqual({ isMobile: false, isTablet: false });
    });
  });

  describe('antdScreenTokens', () => {
    it('should expose a consistent set of breakpoint tokens derived from 600 / 1024', () => {
      // mobile = 600, tablet = 1024
      expect(antdScreenTokens).toEqual({
        screenLG: 1025,
        screenLGMin: 1025,
        screenMD: 601,
        screenMDMax: 1024,
        screenMDMin: 601,
        screenSMMax: 600,
      });
    });
  });

  describe('selectors', () => {
    it('isMobile() should read the current store value', () => {
      expect(isMobile()).toBe(false);
      useScreenStore.setState({ isMobile: true });
      expect(isMobile()).toBe(true);
    });

    it('isTablet() should read the current store value', () => {
      expect(isTablet()).toBe(false);
      useScreenStore.setState({ isTablet: true });
      expect(isTablet()).toBe(true);
    });

    it('isTabletOrMobile() should be true when either flag is set', () => {
      expect(isTabletOrMobile()).toBe(false);

      useScreenStore.setState({ isMobile: true, isTablet: false });
      expect(isTabletOrMobile()).toBe(true);

      useScreenStore.setState({ isMobile: false, isTablet: true });
      expect(isTabletOrMobile()).toBe(true);

      useScreenStore.setState({ isMobile: true, isTablet: true });
      expect(isTabletOrMobile()).toBe(true);
    });
  });

  describe('initScreenStore', () => {
    // The module has a private `initialized` guard that latches on first successful init and
    // never resets across tests. All matchMedia-driven behaviour must therefore be asserted in
    // the FIRST init test below; later tests can only assert the guard's short-circuit.
    const realMatchMedia = window.matchMedia;

    afterEach(() => {
      // restore whatever we stubbed
      (window as any).matchMedia = realMatchMedia;
    });

    it('should wire matchMedia listeners and seed state from the initial matches (first init)', () => {
      const changeHandlers: Array<() => void> = [];
      // setupTests matchMedia mock: matches = query.includes('max-width'); both our queries
      // contain max-width, so both report matches=true on this first run.
      const makeMql = () => ({
        addEventListener: jest.fn((_evt: string, cb: () => void) => changeHandlers.push(cb)),
        addListener: jest.fn(),
        matches: true,
      });

      const matchMediaSpy = jest.fn(() => makeMql());

      (window as any).matchMedia = matchMediaSpy;

      initScreenStore();

      // one call per breakpoint (mobile + tablet)
      expect(matchMediaSpy).toHaveBeenCalledTimes(2);
      expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 600px)');
      expect(matchMediaSpy).toHaveBeenCalledWith('(min-width: 601px) and (max-width: 1024px)');

      // update() ran once during init, seeding both flags from matches=true
      expect(useScreenStore.getState()).toEqual({ isMobile: true, isTablet: true });

      // a registered change listener should push new matches into the store
      expect(changeHandlers.length).toBeGreaterThan(0);
    });

    it('should be idempotent: a second call short-circuits without touching matchMedia again', () => {
      const matchMediaSpy = jest.fn(() => ({
        addEventListener: jest.fn(),
        addListener: jest.fn(),
        matches: false,
      }));

      (window as any).matchMedia = matchMediaSpy;

      // already initialized by the previous test's first init -> guard short-circuits
      initScreenStore();

      expect(matchMediaSpy).not.toHaveBeenCalled();
    });
  });
});
