import type { AliasToken } from 'antd/es/theme/internal';
import { create } from 'zustand';

export enum RwdKey {
  Mobile,
  Tablet,
  Desktop,
}

const breakpoints = {
  [RwdKey.Mobile]: 600,
  [RwdKey.Tablet]: 1024,
};

/* eslint-disable perfectionist/sort-objects */
export const antdScreenTokens: Partial<AliasToken> = {
  screenSMMax: breakpoints[RwdKey.Mobile],
  screenMD: breakpoints[RwdKey.Mobile] + 1,
  screenMDMin: breakpoints[RwdKey.Mobile] + 1,
  screenMDMax: breakpoints[RwdKey.Tablet],
  screenLG: breakpoints[RwdKey.Tablet] + 1,
  screenLGMin: breakpoints[RwdKey.Tablet] + 1,
};
/* eslint-enable perfectionist/sort-objects */

type ScreenState = {
  isMobile: boolean;
  isTablet: boolean;
};

export const useScreenStore = create<ScreenState>(() => ({
  isMobile: false,
  isTablet: false,
}));

let initialized = false;

export const initScreenStore = () => {
  if (initialized || typeof window === 'undefined') return;

  initialized = true;

  if (window.matchMedia) {
    const mobile = window.matchMedia(`(max-width: ${breakpoints[RwdKey.Mobile]}px)`);
    const tablet = window.matchMedia(
      `(min-width: ${breakpoints[RwdKey.Mobile] + 1}px) and (max-width: ${breakpoints[RwdKey.Tablet]}px)`,
    );
    const update = () => {
      useScreenStore.setState({
        isMobile: mobile.matches,
        isTablet: tablet.matches,
      });
    };
    const addListener = (mql: MediaQueryList) => {
      // Fallback to mql.addListener
      mql.addEventListener?.('change', update) ?? mql.addListener(update);
    };

    addListener(mobile);
    addListener(tablet);
    update();
  } else {
    // Fallback to window.resize event
    const update = () => {
      const width = window.innerWidth;

      useScreenStore.setState({
        isMobile: width <= breakpoints[RwdKey.Mobile],
        isTablet: width > breakpoints[RwdKey.Mobile] && width <= breakpoints[RwdKey.Tablet],
      });
    };
    let ticking = false;
    const handler = () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    window.addEventListener('resize', handler);
    update();
  }
};

// Syntactic sugar
export const isMobile = (): boolean => useScreenStore.getState().isMobile;
export const isTablet = (): boolean => useScreenStore.getState().isTablet;
export const isTabletOrMobile = (): boolean => useScreenStore.getState().isMobile || useScreenStore.getState().isTablet;

export const useIsMobile = (): boolean => useScreenStore((state) => state.isMobile);
export const useIsTablet = (): boolean => useScreenStore((state) => state.isTablet);
export const useIsTabletOrMobile = (): boolean => useScreenStore((state) => state.isMobile || state.isTablet);

export const useRwdKey = (): RwdKey =>
  useScreenStore((state) => (state.isMobile ? RwdKey.Mobile : state.isTablet ? RwdKey.Tablet : RwdKey.Desktop));
