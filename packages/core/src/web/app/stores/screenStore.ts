import type { AliasToken } from 'antd/es/theme/internal';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const breakpoints = {
  mobile: 600,
  tablet: 1024,
};

/* eslint-disable perfectionist/sort-objects */
export const antdScreenTokens: Partial<AliasToken> = {
  screenSMMax: breakpoints.mobile,
  screenMD: breakpoints.mobile + 1,
  screenMDMin: breakpoints.mobile + 1,
  screenMDMax: breakpoints.tablet,
  screenLG: breakpoints.tablet + 1,
  screenLGMin: breakpoints.tablet + 1,
};
/* eslint-enable perfectionist/sort-objects */

type ScreenState = {
  isMobile: boolean;
  isTablet: boolean;
};

export const useScreenStore = create(
  subscribeWithSelector<ScreenState>(() => ({
    isMobile: false,
    isTablet: false,
  })),
);

let initialized = false;

export const initScreenStore = () => {
  if (initialized || typeof window === 'undefined') return;

  initialized = true;

  if (window.matchMedia) {
    const mobile = window.matchMedia(`(max-width: ${breakpoints.mobile}px)`);
    const tablet = window.matchMedia(
      `(min-width: ${breakpoints.mobile + 1}px) and (max-width: ${breakpoints.tablet}px)`,
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
        isMobile: width <= breakpoints.mobile,
        isTablet: width > breakpoints.mobile && width <= breakpoints.tablet,
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
