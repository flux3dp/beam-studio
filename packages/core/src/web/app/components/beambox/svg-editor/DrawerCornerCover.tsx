import React, { memo, useEffect, useMemo, useState } from 'react';

import { match } from 'ts-pattern';

import styles from './DrawerCornerCover.module.scss';

type DrawerCornerCoverProps = {
  drawerVisible: boolean;
  width: number; // in pixels
};

const FADE_IN_DURATION = 0.5;
const DRAWER_BACKGROUND_COLOR = '#1890FF';
const CORNER_RADIUS = '1.5rem';
const BOTTOM_PATCH_HEIGHT = '1.3rem'; // This is the height of the bottom patch, matching the corner radius

const convertRemToPx = (remString: string): number => {
  // Ensure this code runs only in the browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Fallback for SSR or non-DOM environments: assume 1rem = 16px
    const fallbackRootFontSize = 16;

    return Number.parseFloat(remString) * fallbackRootFontSize;
  }

  const numericalValue = Number.parseFloat(remString);

  if (Number.isNaN(numericalValue)) {
    console.warn(`[DrawerCornerCover] Invalid rem value for conversion: ${remString}`);

    return 24; // Fallback to a default value (e.g., 24px for 1.5rem)
  }

  // Get the computed font size
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

  return numericalValue * rootFontSize;
};

// R is the radius in pixels
const getSpandrelClipPathString = (type: 'bl' | 'br' | 'tl' | 'tr', R: number): string =>
  match(type)
    .with('tl', () => `path('M 0 ${R} L 0 0 L ${R} 0 A ${R} ${R} 0 0 0 0 ${R} Z')`)
    .with('tr', () => `path('M 0 0 L ${R} 0 L ${R} ${R} A ${R} ${R} 0 0 0 0 0 Z')`)
    .with('bl', () => `path('M ${R} ${R} L 0 ${R} L 0 0 A ${R} ${R} 0 0 0 ${R} ${R} Z')`)
    .with('br', () => `path('M ${R} 0 L ${R} ${R} L 0 ${R} A ${R} ${R} 0 0 0 ${R} 0 Z')`)
    .exhaustive();

const UnmemorizedDrawerCornerCover = ({ drawerVisible, width }: DrawerCornerCoverProps) => {
  const [shouldRenderInDOM, setShouldRenderInDOM] = useState(false);
  const [isOpacityActive, setIsOpacityActive] = useState(false);
  const [opacityTransitionDuration, setOpacityTransitionDuration] = useState(FADE_IN_DURATION);
  const radiusInPx = convertRemToPx(CORNER_RADIUS); // slightly larger than 1 rem for better visibility

  useEffect(() => {
    if (drawerVisible) {
      setShouldRenderInDOM(true);
      setOpacityTransitionDuration(FADE_IN_DURATION); // Set for slower fade-in

      const fadeInTimer = setTimeout(() => {
        setIsOpacityActive(true);
      }, 20); // Small delay for CSS to pick up initial opacity:0 and new transition-duration

      return () => clearTimeout(fadeInTimer);
    } else {
      // For instant fade-out
      setOpacityTransitionDuration(0); // Set duration to 0s
      setIsOpacityActive(false); // Set opacity to 0 (instantly)
      setShouldRenderInDOM(false); // Unmount immediately
    }
  }, [drawerVisible]);

  const clipPaths = useMemo(() => {
    if (radiusInPx <= 0) {
      return { bl: 'none', br: 'none', tl: 'none', tr: 'none' };
    }

    return {
      bl: getSpandrelClipPathString('bl', radiusInPx),
      br: getSpandrelClipPathString('br', radiusInPx),
      tl: getSpandrelClipPathString('tl', radiusInPx),
      tr: getSpandrelClipPathString('tr', radiusInPx),
    };
  }, [radiusInPx]);

  // If not meant to be in DOM (either initially, or after fade-out has completed), render nothing.
  if (!shouldRenderInDOM) {
    return null;
  }

  const coverStyle = {
    height: '100%',
    left: 0,
    opacity: isOpacityActive ? 1 : 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    transition: `opacity ${opacityTransitionDuration}s ease-in-out`,
    width: `${width}px`, // Updates on resize
    zIndex: 1001, // Ensure it is above drawer element
  } as const;

  const cornerPatchBaseStyle = {
    backgroundColor: DRAWER_BACKGROUND_COLOR,
    height: CORNER_RADIUS,
    position: 'absolute',
    width: CORNER_RADIUS,
  } as const;
  const bottomPatchBaseStyle = {
    height: BOTTOM_PATCH_HEIGHT,
  } as const;

  return (
    <div style={coverStyle}>
      <div style={{ ...cornerPatchBaseStyle, clipPath: clipPaths.tl, left: 0, top: 0 }} />
      <div style={{ ...cornerPatchBaseStyle, clipPath: clipPaths.tr, right: 0, top: 0 }} />
      <div className={styles['chat-cover-bottom']} style={{ ...bottomPatchBaseStyle, bottom: 0, left: 0 }} />
      <div className={styles['chat-disclaimer']}>Beamy can make mistakes. Check important info.</div>
    </div>
  );
};

const DrawerCornerCover = memo(UnmemorizedDrawerCornerCover);

export default DrawerCornerCover;
