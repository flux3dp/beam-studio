import classNames from 'classnames';
import React, { useMemo } from 'react';

import isWeb from 'helpers/is-web';
import useI18n from 'helpers/useI18n';
import { getConvertEngine } from 'app/actions/beambox/export-funcs';

interface Props {
  size: string;
  estTime: string;
  lightTime: string;
  rapidTime: string;
  cutDist: string;
  rapidDist: string;
  currentPosition: string;
  handleStartHere: () => void;
  isStartHereEnabled: boolean;
  togglePathPreview: () => void;
}

function SidePanel({
  size,
  estTime,
  lightTime,
  rapidTime,
  cutDist,
  rapidDist,
  currentPosition,
  handleStartHere,
  isStartHereEnabled,
  togglePathPreview,
}: Props): JSX.Element {
  const LANG = useI18n().beambox.path_preview;
  const renderDataBlock = (label: string, value: string): JSX.Element => (
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
    []
  );

  const isStartHereHidden = useMemo(() => {
    const { useSwiftray } = getConvertEngine();
    return useSwiftray;
  }, []);

  return (
    <div id="path-preview-side-panel" className={sideClass}>
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
