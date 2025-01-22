import React, { useMemo } from 'react';

import classNames from 'classnames';

import { getConvertEngine } from '@core/app/actions/beambox/export-funcs';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';

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
  togglePathPreview: () => void;
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
  togglePathPreview,
}: Props): React.JSX.Element {
  const LANG = useI18n().beambox.path_preview;
  const renderDataBlock = (label: string, value: string): React.JSX.Element => (
    <div className="data-block">
      <div className="item">{label}</div>
      <div className="value">{value}</div>
    </div>
  );

  const sideClass = useMemo(
    () =>
      classNames({
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
      <div className="title">{LANG.preview_info}</div>
      <div className="datas">
        {renderDataBlock(LANG.size, size)}
        {renderDataBlock(LANG.estimated_time, estTime)}
        {renderDataBlock(LANG.cut_time, lightTime)}
        {renderDataBlock(LANG.rapid_time, rapidTime)}
        {renderDataBlock(LANG.cut_distance, cutDist)}
        {renderDataBlock(LANG.rapid_distance, rapidDist)}
        {renderDataBlock(LANG.current_position, currentPosition)}
      </div>
      <div className="remark">{LANG.remark}</div>
      <div className="buttons">
        {isStartHereHidden || (
          <div
            className={classNames('btn btn-default primary', { disabled: !isStartHereEnabled })}
            onClick={isStartHereEnabled ? handleStartHere : null}
          >
            {LANG.start_here}
          </div>
        )}
        <div className="btn btn-default" onClick={togglePathPreview}>
          {LANG.end_preview}
        </div>
      </div>
    </div>
  );
}

export default SidePanel;
