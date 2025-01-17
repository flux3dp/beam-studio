import * as React from 'react';
import classNames from 'classnames';
import { FloatingPanel as AntdFloatingPanel } from 'antd-mobile';

import ActionIcon from 'app/icons/action-panel/ActionPanelIcons';
import Icon from '@ant-design/icons';

import styles from './FloatingPanel.module.scss';

interface Props {
  className?: string;
  anchors: number[];
  title: string | JSX.Element;
  fixedContent?: React.ReactNode;
  children: React.ReactNode;
  forceClose?: boolean;
  onClose?: () => void;
}

const FloatingPanel = ({
  className,
  anchors,
  title,
  fixedContent,
  children,
  forceClose = false,
  onClose,
}: Props): JSX.Element => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className={classNames(className, styles.panel)}
      ref={panelRef}
      data-animating={isAnimating}
      anchors={anchors}
      handleDraggingOfContent={false}
      onHeightChange={onHeightChange}
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
