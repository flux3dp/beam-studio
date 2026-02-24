// From https://gist.github.com/MilllerTime/53d67483cc908bdccbcd2a88dbf21838

// Allows listening for pointer events using PEP for browsers that don't support them.
// This component also adds support for dynamic event addition/removal that React does well,
// even though React doesn't support any pointer events yet.

import React, { useEffect, useRef } from 'react';

// A mapping of pointer event props to event names.
const pointerEventMap = {
  onPointerCancel: 'pointercancel',
  onPointerDown: 'pointerdown',
  onPointerEnter: 'pointerenter',
  onPointerLeave: 'pointerleave',
  onPointerMove: 'pointermove',
  onPointerOut: 'pointerout',
  onPointerOver: 'pointerover',
  onPointerUp: 'pointerup',
};

// An array of just the pointer event props.
const pointerEventProps = Object.keys(pointerEventMap);

interface PointableProps {
  children?: React.ReactNode;
  onPointerCancel?: any;
  onPointerDown?: any;
  onPointerEnter?: any;
  onPointerLeave?: any;
  onPointerMove?: any;
  onPointerOut?: any;
  onPointerOver?: any;
  onPointerUp?: any;
  onWheel?: any;
  style?: any;
  touchAction: 'auto' | 'manipulation' | 'none' | 'pan-x' | 'pan-y';
}

const Pointable = (props: PointableProps): React.JSX.Element => {
  const { children, onWheel } = props;
  const nodeRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);

  propsRef.current = props;

  useEffect(() => {
    const node = nodeRef.current;

    if (!node) return;

    const listeners: Array<{ event: string; handler: (e: any) => void }> = [];
    let hasPE = false;

    pointerEventProps.forEach((eventProp) => {
      const listener = propsRef.current[eventProp];

      if (listener) {
        hasPE = true;

        const handler = (e: any) => listener(e);

        node.addEventListener(pointerEventMap[eventProp], handler);
        listeners.push({ event: pointerEventMap[eventProp], handler });
      }
    });

    if (hasPE) {
      node.setAttribute('touch-action', propsRef.current.touchAction);
    }

    return () => {
      listeners.forEach(({ event, handler }) => {
        node.removeEventListener(event, handler);
      });
    };
    // Re-register when any pointer event prop changes
  }, [
    props.onPointerCancel,
    props.onPointerDown,
    props.onPointerEnter,
    props.onPointerLeave,
    props.onPointerMove,
    props.onPointerOut,
    props.onPointerOver,
    props.onPointerUp,
    props.touchAction,
  ]);

  // Collect unused props to pass along to rendered node.
  const otherProps = { ...props };

  pointerEventProps.forEach((prop) => delete otherProps[prop]);
  delete otherProps.children;
  delete otherProps.touchAction;
  delete otherProps.onWheel;

  return (
    <div onWheel={onWheel} ref={nodeRef} {...otherProps}>
      {children}
    </div>
  );
};

export default Pointable;
