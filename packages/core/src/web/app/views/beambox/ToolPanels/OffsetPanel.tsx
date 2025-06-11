import React, { useState } from 'react';

import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import SelectView from '@core/app/widgets/Select';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import type { OffsetMode } from '@core/helpers/clipper/offset/constants';
import i18n from '@core/helpers/i18n';
import storage from '@core/implementations/storage';

const LANG = i18n.lang.beambox.tool_panels;

interface Props {
  cornerType: 'round' | 'sharp';
  distance: number;
  mode: OffsetMode;
  onCornerTypeChange: (cornerType: 'round' | 'sharp') => void;
  onDistanceChange: (distance: number) => void;
  onModeChange: (mode: OffsetMode) => void;
}

function OffsetPanel({
  cornerType: offsetCornerType,
  distance: offsetDistance,
  mode: offsetMode,
  onCornerTypeChange,
  onDistanceChange,
  onModeChange,
}: Props): React.JSX.Element {
  const [mode, setMode] = useState(offsetMode);
  const [cornerType, setCornerType] = useState(offsetCornerType);
  const [distance, setDistance] = useState(offsetDistance);
  const [isModeCollapsed, setIsModeCollapsed] = useState(false);
  const [isCornerTypeCollapsed, setIsCornerTypeCollapsed] = useState(false);
  const [isDistanceCollapsed, setIsDistanceCollapsed] = useState(false);

  const handleCornerTypeChange = (cornerType: 'round' | 'sharp') => {
    onCornerTypeChange(cornerType);
    setCornerType(cornerType);
  };

  const handleDistanceChange = (val: number) => {
    onDistanceChange(val);
    setDistance(val);
  };

  const handleModeChange = (mode: OffsetMode) => {
    onModeChange(mode);
    setMode(mode);

    if (mode === 'expand' || mode === 'shrink') handleDistanceChange(0.05);
    else handleDistanceChange(5);
  };

  const offsetOptions: Array<{ label: string; selected: boolean; value: OffsetMode }> = [
    { label: LANG._offset.outward, selected: mode === 'outward', value: 'outward' },
    { label: LANG._offset.inward, selected: mode === 'inward', value: 'inward' },
    { label: 'Expand', selected: mode === 'expand', value: 'expand' },
    { label: 'Shrink', selected: mode === 'shrink', value: 'shrink' },
  ];

  const cornerTypeOptions: Array<{ label: string; selected: boolean; value: 'round' | 'sharp' }> = [
    { label: LANG._offset.sharp, selected: cornerType === 'sharp', value: 'sharp' },
    { label: LANG._offset.round, selected: cornerType === 'round', value: 'round' },
  ];

  const getOffsetString = (input: 'round' | 'sharp' | OffsetMode) =>
    match(input)
      .with(P.union('outward', 'inward', 'round', 'sharp'), () => LANG._offset[input as keyof typeof LANG._offset])
      .with('expand', () => 'Expand')
      .with('shrink', () => 'Shrink')
      .exhaustive();

  const getDistanceUnit = () =>
    (storage.get('default-units') || 'mm') === 'inches' ? `${(distance / 25.4).toFixed(3)}"` : `${distance} mm`;

  return (
    <>
      <div className="tool-panel">
        <label className="controls accordion">
          <input className="accordion-switcher" defaultChecked type="checkbox" />
          <p className="caption" onClick={() => setIsModeCollapsed((prev) => !prev)}>
            {LANG._offset.direction}
            <span className="value">{getOffsetString(mode)}</span>
          </p>
          <div className={classNames('tool-panel-body', { collapsed: isModeCollapsed })}>
            <div className="control offset-dir">
              <SelectView
                id="select-offset-dir"
                onChange={(e) => {
                  handleModeChange(e.target.value as OffsetMode);
                }}
                options={offsetOptions}
              />
            </div>
          </div>
        </label>
      </div>
      <div className="tool-panel">
        <label className="controls accordion">
          <input className="accordion-switcher" defaultChecked type="checkbox" />
          <p className="caption" onClick={() => setIsCornerTypeCollapsed((prev) => !prev)}>
            {LANG._offset.corner_type}
            <span className="value">{getOffsetString(cornerType)}</span>
          </p>
          <div className={classNames('tool-panel-body', { collapsed: isCornerTypeCollapsed })}>
            <div className="control offset-corner">
              <SelectView
                id="select-offset-corner"
                onChange={(e) => handleCornerTypeChange(e.target.value)}
                options={cornerTypeOptions}
              />
            </div>
          </div>
        </label>
      </div>
      <div className="tool-panel">
        <label className="controls accordion">
          <input className="accordion-switcher" defaultChecked type="checkbox" />
          <p className="caption" onClick={() => setIsDistanceCollapsed((prev) => !prev)}>
            {LANG._offset.dist}
            <span className="value">{getDistanceUnit()}</span>
          </p>
          <div className={classNames('tool-panel-body', { collapsed: isDistanceCollapsed })}>
            <div>
              <div className="control offset-dist">
                <UnitInput
                  defaultValue={distance}
                  getValue={(val) => handleDistanceChange(val)}
                  max={['expand', 'shrink'].includes(mode) ? 1 : undefined}
                  min={0}
                  unit="mm"
                />
              </div>
            </div>
          </div>
        </label>
      </div>
    </>
  );
}

export default OffsetPanel;
