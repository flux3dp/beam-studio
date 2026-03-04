import type { ReactNode } from 'react';
import React, { memo, useEffect, useRef } from 'react';

import workareaManager from '@core/app/svgedit/workarea';

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

const moveEditorOut = (real: HTMLDivElement) => {
  const safe = document.getElementById('safe-editor-container');

  if (!safe) return;

  moveEditor(real!, safe!);
};

const SvgEditor = (): ReactNode => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elem = ref.current!;

    moveEditorIn(elem);

    return () => {
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
