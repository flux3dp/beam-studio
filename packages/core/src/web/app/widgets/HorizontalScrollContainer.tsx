import React, { useEffect, useRef, ReactNode } from 'react';

interface Props {
  className?: string;
  children?: ReactNode;
}

const HorizontalScrollContainer = ({ className, children }: Props): JSX.Element => {
  const divRef = useRef<HTMLDivElement>(null);

  const handleDivWheel = (e: WheelEvent) => {
    const currentTarget = e.currentTarget as Element;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const scrollBefore = currentTarget.scrollLeft;
      currentTarget.scrollLeft += e.deltaY;
      if (scrollBefore !== currentTarget.scrollLeft) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  useEffect(() => {
    const div = divRef.current;
    div?.addEventListener('wheel', handleDivWheel, false);
    return () => {
      div?.removeEventListener('wheel', handleDivWheel);
    };
  });

  return (
    <div className={className} ref={divRef}>
      {children}
    </div>
  );
};

export default HorizontalScrollContainer;
