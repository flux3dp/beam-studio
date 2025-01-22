import * as React from 'react';

import Icon from '@ant-design/icons';
import { FloatingPanel as AntdFloatingPanel } from 'antd-mobile';
import classNames from 'classnames';

import ActionIcon from '@core/app/icons/action-panel/ActionPanelIcons';

import styles from './FloatingPanel.module.scss';

interface Props {
  anchors: number[];
  children: React.ReactNode;
  className?: string;
  fixedContent?: React.ReactNode;
  forceClose?: boolean;
  onClose?: () => void;
  title: React.JSX.Element | string;
}

const FloatingPanel = ({
  anchors,
  children,
  className,
  fixedContent,
  forceClose = false,
  onClose,
  title,
}: Props): React.JSX.Element => {
  const panelRef = React.useRef(null);
  const [panelHeight, setPanelHeight] = React.useState(anchors[0]);
  const [isAnimating, setIsAnimating] = React.useState(true);
  const hasClosedRef = React.useRef(false);

  React.useEffect(() => {
    if (forceClose) {
      panelRef.current.setHeight(0);
    } else if (panelHeight === 0 || !anchors.includes(panelHeight)) {
      panelRef.current.setHeight(anchors.find((anchor) => anchor > 0));
      hasClosedRef.current = false;
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [anchors, panelRef, forceClose]);

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
        onClick={() => panelRef.current.setHeight(0)}
      />
      <div className={styles.title}>{title}</div>
      {fixedContent}
      <div className={styles['scroll-content']}>{children}</div>
    </AntdFloatingPanel>
  );
};

export default FloatingPanel;
