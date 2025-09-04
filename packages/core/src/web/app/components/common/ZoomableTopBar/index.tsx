import React, { memo, useCallback, useMemo } from 'react';

import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex } from 'antd';
import classNames from 'classnames';

import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

export interface UndoRedoConfig {
  onRedo: () => void;
  onUndo: () => void;
  redoable: boolean;
  undoable: boolean;
}

export interface ZoomableTopBarProps {
  className?: string;
  handleReset: () => void;
  handleZoomByScale: (scale: number) => void;
  leftContent?: React.ReactNode;
  showZoomPercentage?: boolean;
  undoRedo?: UndoRedoConfig;
  zoomPresets?: number[];
  zoomScale: number;
}

function UnmemorizedZoomableTopBar({
  className,
  handleReset,
  handleZoomByScale,
  leftContent,
  showZoomPercentage = true,
  undoRedo,
  zoomPresets = [25, 50, 75, 100, 150, 200],
  zoomScale,
}: ZoomableTopBarProps): React.JSX.Element {
  const {
    beambox: { zoom_block: langZoom },
    global: { editing: lang },
  } = useI18n();

  const handlePresetZoom = useCallback(
    (ratio: number) => {
      const newScale = ratio / 100;

      handleZoomByScale(newScale / zoomScale);
    },
    [handleZoomByScale, zoomScale],
  );

  const zoomMenuItems = useMemo(
    () => [
      { key: 'fit_to_window', label: langZoom.fit_to_window || 'Fit to Window' },
      { type: 'divider' as const },
      ...zoomPresets.map((ratio) => ({ key: ratio.toString(), label: `${ratio}%` })),
    ],
    [langZoom.fit_to_window, zoomPresets],
  );

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (key === 'fit_to_window') {
        handleReset();

        return;
      }

      const ratio = Number.parseInt(key, 10);

      handlePresetZoom(ratio);
    },
    [handleReset, handlePresetZoom],
  );

  // Render undo/redo buttons if config is provided
  const undoRedoButtons = useMemo(() => {
    if (!undoRedo) return null;

    const { onRedo, onUndo, redoable, undoable } = undoRedo;

    return (
      <>
        <Button
          className={styles['action-button']}
          disabled={!undoable}
          icon={<TopBarIcons.Undo />}
          onClick={onUndo}
          shape="round"
          title={lang.undo}
        />
        <Button
          className={styles['action-button']}
          disabled={!redoable}
          icon={<TopBarIcons.Redo />}
          onClick={onRedo}
          shape="round"
          title={lang.redo}
        />
      </>
    );
  }, [undoRedo, lang]);

  const renderZoomControls = useCallback(
    () => (
      <div className={styles['zoom-controls']}>
        <Button
          className={styles['zoom-button']}
          icon={<MinusOutlined />}
          onClick={() => handleZoomByScale(0.8)}
          shape="round"
          title={lang.zoom_out}
        />
        {showZoomPercentage && (
          <Dropdown menu={{ items: zoomMenuItems, onClick: handleMenuClick }} trigger={['click']}>
            <div className={styles['zoom-display']}>{Math.round(zoomScale * 100)}%</div>
          </Dropdown>
        )}
        <Button
          className={showZoomPercentage ? undefined : styles['zoom-button']}
          icon={<PlusOutlined />}
          onClick={() => handleZoomByScale(1.2)}
          shape="round"
          title={lang.zoom_in}
        />
      </div>
    ),
    [handleZoomByScale, showZoomPercentage, zoomScale, zoomMenuItems, handleMenuClick, lang],
  );

  return (
    <Flex className={classNames(styles['top-bar'], className)} justify="space-between">
      <div>{leftContent || undoRedoButtons}</div>
      {renderZoomControls()}
    </Flex>
  );
}

const ZoomableTopBar = memo(UnmemorizedZoomableTopBar);

export default ZoomableTopBar;
