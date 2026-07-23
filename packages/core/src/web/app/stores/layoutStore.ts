import { pick } from 'remeda';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

import { templateModes, useInteractionModeStore, withinInteractionModes } from './interactionModeStore';
import { useScreenStore } from './screenStore';

export enum LayoutKey {
  Desktop,
  Mobile,
  Tablet,
}

type LayoutState = {
  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
  layout: LayoutKey;
};

const getLayout = ({
  isMobile = useScreenStore.getState().isMobile,
  isTablet = useScreenStore.getState().isTablet,
  isWithinTemplateModes = withinInteractionModes(templateModes),
}: Partial<{
  isMobile: boolean;
  isTablet: boolean;
  isWithinTemplateModes: boolean;
}> = {}): LayoutState => {
  if (isMobile) {
    return { isDesktop: false, isMobile: true, isTablet: false, layout: LayoutKey.Mobile };
  } else if (isTablet || isWithinTemplateModes) {
    return { isDesktop: false, isMobile: false, isTablet: true, layout: LayoutKey.Tablet };
  } else {
    return { isDesktop: true, isMobile: false, isTablet: false, layout: LayoutKey.Desktop };
  }
};

export const useLayoutStore = create(subscribeWithSelector<LayoutState>(() => getLayout()));

useScreenStore.subscribe(
  (state) => pick(state, ['isMobile', 'isTablet']),
  ({ isMobile, isTablet }) => {
    useLayoutStore.setState(getLayout({ isMobile, isTablet }));
  },
  { equalityFn: shallow },
);
useInteractionModeStore.subscribe(
  (state) => templateModes.includes(state.interactionMode),
  (isWithinTemplateModes) => {
    useLayoutStore.setState(getLayout({ isWithinTemplateModes }));
  },
);

// Syntactic sugar
export const isMobile = (): boolean => useLayoutStore.getState().isMobile;
export const isTablet = (): boolean => useLayoutStore.getState().isTablet;
export const isTabletOrMobile = (): boolean => useLayoutStore.getState().isMobile || useLayoutStore.getState().isTablet;
export const isDesktop = (): boolean => useLayoutStore.getState().isDesktop;

export const useIsMobile = (): boolean => useLayoutStore((state) => state.isMobile);
export const useIsTablet = (): boolean => useLayoutStore((state) => state.isTablet);
export const useIsTabletOrMobile = (): boolean => useLayoutStore((state) => state.isMobile || state.isTablet);
export const useIsDesktop = (): boolean => useLayoutStore((state) => state.isDesktop);
