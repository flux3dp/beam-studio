import type { ReactNode } from 'react';
import React, { memo, useEffect, useRef } from 'react';

import workareaManager from '@core/app/svgedit/workarea';

import styles from './RealSvgEditor.module.scss';

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

  return <div className={styles.container} id="real-editor-container" ref={ref} />;
};

export default memo(SvgEditor);
