import React, { memo, useCallback, useMemo } from 'react';

import { ArrowLeftOutlined, ArrowRightOutlined, MinusOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import useI18n from '@core/helpers/useI18n';

import { useImageEditPanelStore } from '../../store';

import styles from './index.module.scss';

interface Props {
  handleReset: () => void;
  handleZoomByScale: (scale: number) => void;
  zoomScale: number;
}

function UnmemorizedTopBar({ handleReset, handleZoomByScale, zoomScale }: Props): React.JSX.Element {
  const {
    global: { editing: lang },
  } = useI18n();
  const {
    history: { index, operations },
    redo,
    undo,
  } = useImageEditPanelStore(useShallow(pick(['history', 'redo', 'undo'])));
  const { redoable, undoable } = useMemo(
    () => ({ redoable: index < operations.length, undoable: index > 0 }),
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
          disabled={!undoable}
          icon={<ArrowLeftOutlined />}
          onClick={undo}
          shape="round"
          title={lang.undo}
        />
        <Button disabled={!redoable} icon={<ArrowRightOutlined />} onClick={redo} shape="round" title={lang.redo} />
      </div>
      {renderZoomButton()}
    </Flex>
  );
}

const TopBar = memo(UnmemorizedTopBar);

export default TopBar;
