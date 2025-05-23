import React, { memo, useEffect, useState } from 'react';

type DrawerCornerCoverProps = {
  drawerVisible: boolean;
  width: number; // in pixels
};

const FADE_IN_DURATION = 0.5;

// background-color: rgb(24, 144, 255);
// linear-gradient(180deg, rgba(34,34,37,0.9), rgba(29,29,32,0.9) 90.48%);
// linear-gradient(180deg, rgba(249, 250, 251, 0.9), rgba(242, 244, 247, 0.9) 90.48%)
// rgb(29, 41, 54)
const UnmemorizedDrawerCornerCover = ({ drawerVisible, width }: DrawerCornerCoverProps) => {
  const [shouldRenderInDOM, setShouldRenderInDOM] = useState(false);
  const [isOpacityActive, setIsOpacityActive] = useState(false);
  const [opacityTransitionDuration, setOpacityTransitionDuration] = useState(FADE_IN_DURATION);

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
      setIsOpacityActive(false); // Set opacity to 0 (will be instant)
      setShouldRenderInDOM(false); // Unmount immediately
    }
  }, [drawerVisible]);

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
  } as const;

  const cornerPatchBaseStyle = {
    // backgroundColor: drawerBgColor,
    height: '1.3rem',
    position: 'absolute',
    width: '100%',
  } as const;

  return (
    <div style={coverStyle}>
      <div style={{ ...cornerPatchBaseStyle, bottom: 0, left: 0 }} />
    </div>
  );
};

const DrawerCornerCover = memo(UnmemorizedDrawerCornerCover);

export default DrawerCornerCover;
