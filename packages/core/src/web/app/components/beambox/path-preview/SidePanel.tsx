import React, { useMemo } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import { getConvertEngine } from '@core/app/actions/beambox/export-funcs';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';

import styles from './SidePanel.module.scss';

interface Props {
  currentPosition: string;
  cutDist: string;
  estTime: string;
  handleStartHere: () => void;
  isStartHereEnabled: boolean;
  lightTime: string;
  rapidDist: string;
  rapidTime: string;
  size: string;
}

function SidePanel({
  currentPosition,
  cutDist,
  estTime,
  handleStartHere,
  isStartHereEnabled,
  lightTime,
  rapidDist,
  rapidTime,
  size,
}: Props): React.JSX.Element {
  const togglePathPreview = useCanvasStore((state) => state.togglePathPreview);
  const LANG = useI18n().beambox.path_preview;
  const renderDataBlock = (label: string, value: string): React.JSX.Element => (
    <div className={styles['data-block']}>
      <div className={styles.item}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );

  const sideClass = useMemo(
    () =>
      classNames(styles.container, {
        short: window.os === 'Windows' && !isWeb(),
        wide: window.os !== 'MacOS',
      }),
    [],
  );

  const isStartHereHidden = useMemo(() => {
    const { useSwiftray } = getConvertEngine();

    return useSwiftray;
  }, []);

  return (
    <div className={sideClass} id="path-preview-side-panel">
      <div className={styles.title}>{LANG.preview_info}</div>
      <div className={styles.datas}>
        {renderDataBlock(LANG.size, size)}
        {renderDataBlock(LANG.estimated_time, estTime)}
        {renderDataBlock(LANG.cut_time, lightTime)}
        {renderDataBlock(LANG.rapid_time, rapidTime)}
        {renderDataBlock(LANG.cut_distance, cutDist)}
        {renderDataBlock(LANG.rapid_distance, rapidDist)}
        {renderDataBlock(LANG.current_position, currentPosition)}
      </div>
      <div className={styles.remark}>{LANG.remark}</div>
      <div className={styles.buttons}>
        {isStartHereHidden || (
          <Button
            className={styles.btn}
            color="default"
            disabled={!isStartHereEnabled}
            onClick={isStartHereEnabled ? handleStartHere : undefined}
            variant="solid"
          >
            {LANG.start_here}
          </Button>
        )}
        <Button className={styles.btn} color="default" onClick={togglePathPreview} variant="outlined">
          {LANG.end_preview}
        </Button>
      </div>
    </div>
  );
}

export default SidePanel;
