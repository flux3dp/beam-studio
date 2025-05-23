import React, { memo, useEffect, useMemo, useState } from 'react';

import { match } from 'ts-pattern';

type DrawerCornerCoverProps = {
  cornerRadiusCSS: string; // e.g., '1.5rem'
  drawerBgColor: string;
  drawerVisible: boolean;
  width: number; // in pixels
  zIndex: number;
};

const FADE_IN_DURATION = 0.5;

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

  // Get the computed font size of the root element (html)
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

// background-color: rgb(24, 144, 255);
// linear-gradient(180deg, rgba(34,34,37,0.9), rgba(29,29,32,0.9) 90.48%);
// linear-gradient(180deg, rgba(249, 250, 251, 0.9), rgba(242, 244, 247, 0.9) 90.48%)
// rgb(29, 41, 54)
const UnmemorizedDrawerCornerCover = ({
  // Renamed to use with React.memo later
  cornerRadiusCSS,
  drawerBgColor,
  drawerVisible,
  width,
  zIndex,
}: DrawerCornerCoverProps) => {
  const [radiusInPx, setRadiusInPx] = useState<number>(0);
  // State to control if the component should be in the DOM
  const [shouldRenderInDOM, setShouldRenderInDOM] = useState(false);
  // State to control the opacity for CSS transition
  const [isOpacityActive, setIsOpacityActive] = useState(false);
  const [opacityTransitionDuration, setOpacityTransitionDuration] = useState(FADE_IN_DURATION);

  useEffect(() => {
    setRadiusInPx(convertRemToPx(cornerRadiusCSS));
  }, [cornerRadiusCSS]);

  useEffect(() => {
    if (drawerVisible) {
      setShouldRenderInDOM(true);
      setOpacityTransitionDuration(FADE_IN_DURATION); // Set for slower fade-in

      const fadeInTimer = setTimeout(() => {
        if (radiusInPx > 0) {
          setIsOpacityActive(true); // Trigger opacity to 1
        }
      }, 20); // Small delay for CSS to pick up initial opacity:0 and new transition-duration

      return () => clearTimeout(fadeInTimer);
    } else {
      // For instant fade-out
      setOpacityTransitionDuration(0); // Set duration to 0s
      setIsOpacityActive(false); // Set opacity to 0 (will be instant)
      setShouldRenderInDOM(false); // Unmount immediately
    }
  }, [drawerVisible, radiusInPx]);

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
    opacity: isOpacityActive && radiusInPx > 0 ? 1 : 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    transition: `opacity ${opacityTransitionDuration}s ease-in-out`,
    width: `${width}px`, // Updates on resize
    zIndex,
  } as const;

  const cornerPatchBaseStyle = {
    backgroundColor: drawerBgColor,
    height: cornerRadiusCSS,
    position: 'absolute',
    width: cornerRadiusCSS,
  } as const;

  return (
    <div style={coverStyle}>
      <div style={{ ...cornerPatchBaseStyle, clipPath: clipPaths.tl, left: 0, top: 0 }} />
      <div style={{ ...cornerPatchBaseStyle, clipPath: clipPaths.tr, right: 0, top: 0 }} />
      <div style={{ ...cornerPatchBaseStyle, bottom: 0, clipPath: clipPaths.bl, left: 0 }} />
      <div style={{ ...cornerPatchBaseStyle, bottom: 0, clipPath: clipPaths.br, right: 0 }} />
    </div>
  );
};

const DrawerCornerCover = memo(UnmemorizedDrawerCornerCover);

export default DrawerCornerCover;
