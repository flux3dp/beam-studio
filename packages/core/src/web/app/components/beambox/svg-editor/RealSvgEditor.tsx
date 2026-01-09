import type { ReactNode } from 'react';
import React, { memo, useRef } from 'react';
import { useEffect } from 'react';

import workareaManager from '@core/app/svgedit/workarea';
import { uniqueId } from '@core/helpers/react-contextmenu/helpers';

const moveEditor = (from: HTMLElement, to: HTMLElement) => {
  while (from.children.length > 0) {
    to.appendChild(from.children[0]);
  }
};

const moveEditorIn = (real: HTMLDivElement) => {
  const safe = document.getElementById('safe-editor-container');

  if (!safe) return;

  moveEditor(safe!, real!);
  workareaManager.resetView();
};

export const moveEditorOut = (real: HTMLDivElement) => {
  const safe = document.getElementById('safe-editor-container');

  if (!safe) return;

  moveEditor(real!, safe!);
};

const SvgEditor = (): ReactNode => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = uniqueId();
    const elem = ref.current!;

    console.log(`SVG Editor mounted: ${id}`);
    moveEditorIn(elem);

    return () => {
      console.log(`SVG Editor unmounted: ${id}`);
      moveEditorOut(elem);
    };
  }, []);

  return (
    <div
      id="real-editor-container"
      ref={ref}
      style={{
        display: 'flex',
        flex: 1, // Fix mobile height
        height: '100%',
        width: '100%',
      }}
    />
  );
};

export default memo(SvgEditor);
