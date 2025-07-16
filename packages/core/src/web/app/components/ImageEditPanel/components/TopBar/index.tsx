import React, { memo, useCallback, useMemo } from 'react';

import { ArrowLeftOutlined, ArrowRightOutlined, MinusOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import { useImageEditPanelStore } from '../../store';

import styles from './index.module.scss';

interface Props {
  handleReset: () => void;
  handleZoomByScale: (scale: number) => void;
  zoomScale: number;
}

function TopBar({ handleReset, handleZoomByScale, zoomScale }: Props): React.JSX.Element {
  const {
    global: { editing: lang },
  } = useI18n();
  const { history, redo, undo } = useImageEditPanelStore();
  const { index, operations } = history;
  const { canRedo, canUndo } = useMemo(
    () => ({
      canRedo: index < operations.length,
      canUndo: index > 0,
    }),
    [index, operations.length],
  );

  // to realtime update zoom scale display
  const renderZoomButton = useCallback(
    () => (
      <div className={styles['dp-flex']}>
        <Button
          className={styles['mr-8px']}
          icon={<MinusOutlined />}
          onClick={() => handleZoomByScale(0.8)}
          shape="round"
          title={lang.zoom_out}
        />
        <div className={classNames(styles['mr-8px'], styles['lh-32px'])}>{Math.round(zoomScale * 100)}%</div>
        <Button
          className={styles['mr-8px']}
          icon={<PlusOutlined />}
          onClick={() => handleZoomByScale(1.2)}
          shape="round"
          title={lang.zoom_in}
        />
        <Button icon={<ReloadOutlined />} onClick={handleReset} shape="circle" title={lang.reset} />
      </div>
    ),
    [handleReset, handleZoomByScale, zoomScale, lang],
  );

  return (
    <Flex className={classNames(styles['w-100'], styles['top-bar'], styles.bdb)} justify="space-between">
      <div>
        <Button
          className={styles['mr-8px']}
          disabled={!canUndo}
          icon={<ArrowLeftOutlined />}
          onClick={undo}
          shape="round"
          title={lang.undo}
        />
        <Button disabled={!canRedo} icon={<ArrowRightOutlined />} onClick={redo} shape="round" title={lang.redo} />
      </div>
      {renderZoomButton()}
    </Flex>
  );
}

const MemorizedTopBar = memo(TopBar);

export default MemorizedTopBar;
