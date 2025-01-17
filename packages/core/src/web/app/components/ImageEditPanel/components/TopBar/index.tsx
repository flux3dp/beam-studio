import React, { memo, useCallback } from 'react';

import { Button, Flex } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';

import useI18n from 'helpers/useI18n';

import { HistoryState } from '../../hooks/useHistory';

import styles from './index.module.scss';

interface Props {
  handleReset: () => void;
  handleZoomByScale: (scale: number) => void;
  zoomScale: number;
  history: HistoryState;
  handleHistoryChange: (type: 'undo' | 'redo') => () => void;
}

function TopBar({
  handleReset,
  handleZoomByScale,
  zoomScale,
  history: { index, items },
  handleHistoryChange,
}: Props): JSX.Element {
  const {
    global: { editing: lang },
  } = useI18n();
  // to realtime update zoom scale display
  const renderZoomButton = useCallback(
    () => (
      <div className={styles['dp-flex']}>
        <Button
          title={lang.zoom_out}
          className={styles['mr-8px']}
          shape="round"
          icon={<MinusOutlined />}
          onClick={() => handleZoomByScale(0.8)}
        />
        <div className={classNames(styles['mr-8px'], styles['lh-32px'])}>
          {Math.round(zoomScale * 100)}%
        </div>
        <Button
          title={lang.zoom_in}
          className={styles['mr-8px']}
          shape="round"
          icon={<PlusOutlined />}
          onClick={() => handleZoomByScale(1.2)}
        />
        <Button title={lang.reset} shape="circle" icon={<ReloadOutlined />} onClick={handleReset} />
      </div>
    ),
    [handleReset, handleZoomByScale, zoomScale, lang]
  );

  return (
    <Flex
      justify="space-between"
      className={classNames(styles['w-100'], styles['top-bar'], styles.bdb)}
    >
      <div>
        <Button
          className={styles['mr-8px']}
          title={lang.undo}
          shape="round"
          icon={<ArrowLeftOutlined />}
          disabled={index === 0}
          onClick={handleHistoryChange('undo')}
        />
        <Button
          shape="round"
          title={lang.redo}
          icon={<ArrowRightOutlined />}
          disabled={index === items.length - 1}
          onClick={handleHistoryChange('redo')}
        />
      </div>
      {renderZoomButton()}
    </Flex>
  );
}

const MemorizedTopBar = memo(TopBar);

export default MemorizedTopBar;
