import * as React from 'react';

import Icon from '@ant-design/icons';
import type { FloatingPanelRef } from 'antd-mobile';
import { FloatingPanel as AntdFloatingPanel } from 'antd-mobile';
import classNames from 'classnames';

import ActionIcon from '@core/app/icons/action-panel/ActionPanelIcons';

import styles from './FloatingPanel.module.scss';

export interface FloatingPanelHandle {
  scrollTo: (options: { behavior?: 'auto' | 'smooth'; top?: number }) => void;
  setHeight: (height: number) => void;
}

interface Props {
  anchors: number[];
  children: React.ReactNode;
  className?: string;
  fixedContent?: React.ReactNode;
  forceClose?: boolean;
  onClose?: () => void;
  onReady?: (handle: FloatingPanelHandle) => void;
  title: React.JSX.Element | string;
}

const FloatingPanel = ({
  anchors,
  children,
  className,
  fixedContent,
  forceClose = false,
  onClose,
  onReady,
  title,
}: Props): React.JSX.Element => {
  const [panelHeight, setPanelHeight] = React.useState(anchors[0]);
  const [isAnimating, setIsAnimating] = React.useState(true);
  const hasClosedRef = React.useRef(false);
  const panelRef = React.useRef<FloatingPanelRef>(null);
  const scrollContentRef = React.useRef<HTMLDivElement>(null);

  // Expose handle to parent via callback
  React.useEffect(() => {
    if (onReady) {
      onReady({
        scrollTo: (options) => {
          scrollContentRef.current?.scrollTo(options);
        },
        setHeight: (height) => {
          panelRef.current?.setHeight(height);
        },
      });
    }
  }, [onReady]);

  React.useEffect(() => {
    if (forceClose) {
      panelRef.current?.setHeight(0);
    } else if (panelHeight === 0 || !anchors.includes(panelHeight)) {
      panelRef.current?.setHeight(anchors.find((anchor) => anchor > 0) || 0);
      hasClosedRef.current = false;
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [anchors, forceClose]);

  const onHeightChange = (height: number, animating: boolean) => {
    setPanelHeight(height);
    setIsAnimating(animating);

    if (height <= 0 && !hasClosedRef.current) {
      hasClosedRef.current = true;
      onClose?.();
    }
  };

  return (
    <AntdFloatingPanel
      anchors={anchors}
      className={classNames(className, styles.panel)}
      data-animating={isAnimating}
      handleDraggingOfContent={false}
      onHeightChange={onHeightChange}
      ref={panelRef}
      style={{ height: panelHeight }}
    >
      <Icon
        className={styles['close-icon']}
        component={ActionIcon.Delete}
        onClick={() => panelRef.current?.setHeight(0)}
      />
      <div className={styles.title}>{title}</div>
      {fixedContent}
      <div className={styles['scroll-content']} ref={scrollContentRef}>
        {children}
      </div>
    </AntdFloatingPanel>
  );
};

export default FloatingPanel;
