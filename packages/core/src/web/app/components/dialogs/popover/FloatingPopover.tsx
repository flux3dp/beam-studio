import React, { useEffect, useMemo, useState } from 'react';

import type { Alignment, Placement, Side } from '@floating-ui/react';
import { autoUpdate, flip, hide, offset, shift, useFloating } from '@floating-ui/react';
import { Card } from 'antd';
import classNames from 'classnames';
import { createPortal } from 'react-dom';

import styles from './FloatingPopover.module.scss';

const AlignMap: { [key in 'center' | Alignment]: string } = {
  center: 'center',
  end: '100%',
  start: '0%',
};

const SideMap: { [key in Side]: string } = {
  bottom: 'top',
  left: 'right',
  right: 'left',
  top: 'bottom',
};

const getTransformOrigin = (placement: Placement): string => {
  const [side, align] = placement.split('-') as [Side, Alignment | undefined];

  return `${AlignMap[align || 'center']} ${SideMap[side]}`;
};

export interface Props {
  children: React.ReactNode;
  className?: string;
  getContainer?: () => Element | null;
  noAnimation?: boolean;
  open: boolean;
  placement?: Placement;
  reference: Element | null;
  zIndex?: number;
}

/** Antd-styled popover allowing external positioning element reference */
const FloatingPopover = ({
  children,
  className,
  getContainer,
  noAnimation = false,
  open,
  placement,
  reference,
  zIndex = 1,
}: Props) => {
  const {
    isPositioned,
    middlewareData,
    placement: finalPlacement,
    refs,
    strategy,
    x,
    y,
  } = useFloating({
    elements: { reference },
    middleware: [offset(8), flip(), shift({ padding: 8 }), hide({ strategy: 'referenceHidden' })],
    placement,
    whileElementsMounted: autoUpdate,
  });
  const origin = useMemo(() => getTransformOrigin(finalPlacement), [finalPlacement]);
  const [mounted, setMounted] = useState(false);
  const container = getContainer?.();

  useEffect(() => {
    if (open && !mounted) {
      requestAnimationFrame(() => {
        setMounted(isPositioned);
      });
    }

    if (!isPositioned) {
      setMounted(false);
    }
  }, [mounted, open, isPositioned]);

  if ((noAnimation || !mounted) && !open) return null;

  const hidden = middlewareData.hide?.referenceHidden;

  const content = (
    <div
      className={classNames(styles.floating, className, {
        [styles.animation]: !noAnimation,
        [styles.close]: !open || !mounted,
        [styles.hidden]: hidden,
      })}
      onTransitionEnd={() => {
        if (!open) setMounted(false);
      }}
      ref={refs.setFloating}
      style={{ left: x, position: strategy, top: y, transformOrigin: origin, zIndex }}
    >
      <Card className={styles.card}>{children}</Card>
    </div>
  );

  return container ? createPortal(content, container) : content;
};

export default FloatingPopover;
