import React, { memo, useCallback } from 'react';

import { ArrowLeftOutlined, ArrowRightOutlined, MinusOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import type { HistoryState } from '../../hooks/useHistory';

import styles from './index.module.scss';

interface Props {
  handleHistoryChange: (type: 'redo' | 'undo') => () => void;
  handleReset: () => void;
  handleZoomByScale: (scale: number) => void;
  history: HistoryState;
  zoomScale: number;
}

function TopBar({
  handleHistoryChange,
  handleReset,
  handleZoomByScale,
  history: { index, items },
  zoomScale,
}: Props): React.JSX.Element {
  const {
    global: { editing: lang },
  } = useI18n();
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
          disabled={index === 0}
          icon={<ArrowLeftOutlined />}
          onClick={handleHistoryChange('undo')}
          shape="round"
          title={lang.undo}
        />
        <Button
          disabled={index === items.length - 1}
          icon={<ArrowRightOutlined />}
          onClick={handleHistoryChange('redo')}
          shape="round"
          title={lang.redo}
        />
      </div>
      {renderZoomButton()}
    </Flex>
  );
}

const MemorizedTopBar = memo(TopBar);

export default MemorizedTopBar;
