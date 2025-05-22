import React, { useEffect, useMemo, useState } from 'react';

import { match } from 'ts-pattern';

type DrawerCornerCoverProps = {
  cornerRadiusCSS: string; // e.g., '1.5rem'
  drawerBgColor: string;
  drawerVisible: boolean;
  width: number; // in pixels
  zIndex: number;
};

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

const DrawerCornerCover = ({
  cornerRadiusCSS,
  drawerBgColor,
  drawerVisible,
  width,
  zIndex,
}: DrawerCornerCoverProps) => {
  const [radiusInPx, setRadiusInPx] = useState<number>(0);

  useEffect(() => {
    if (drawerVisible) {
      setRadiusInPx(convertRemToPx(cornerRadiusCSS));
    }
    // If the component can be re-rendered with a new cornerRadiusCSS while already visible
  }, [cornerRadiusCSS, drawerVisible]);

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

  // Do not render if not visible or if radius calculation hasn't happened yet (or resulted in 0)
  if (!drawerVisible || radiusInPx <= 0) {
    return null;
  }

  const coverStyle = {
    height: '100%',
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    width: `${width}px`,
    zIndex,
  } as const;

  // The patches themselves are still sized using the original CSS string (e.g., "1.1rem")
  // The clip-path coordinates (now in pixels) will apply to these rem-sized boxes.
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

export default DrawerCornerCover;
