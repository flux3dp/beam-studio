import React, { useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useI18n from '@core/helpers/useI18n';

interface Props {
  dx: number;
  dy: number;
  onValueChange?: (rc: { dx: number; dy: number }) => void;
}

const Interval = ({ dx: propsDx, dy: propsDy, onValueChange }: Props) => {
  const lang = useI18n().beambox.tool_panels;
  const [dx, setDx] = useState(propsDx);
  const [dy, setDy] = useState(propsDy);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const workarea = useWorkarea();
  const { displayHeight, height, width } = useMemo(() => getWorkarea(workarea), [workarea]);
  const isInch = useStorageStore((state) => state['default-units'] === 'inches');

  useEffect(() => setDx(propsDx), [propsDx]);
  useEffect(() => setDy(propsDy), [propsDy]);

  const handleChange = (key: 'dx' | 'dy', value: number) => {
    onValueChange?.({ dx, dy, [key]: value });

    if (key === 'dx') setDx(value);
    else setDy(value);
  };

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption" onClick={() => setIsCollapsed(!isCollapsed)}>
          {lang.array_interval}
          <span className="value">
            {isInch ? `${Number(dx / 25.4).toFixed(3)}", ${Number(dy / 25.4).toFixed(3)}"` : `${dx}, ${dy} mm`}
          </span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>
          <div className="control">
            <span className="text-center header">{lang.dx}</span>
            <UnitInput
              defaultValue={dx}
              getValue={(val) => handleChange('dx', val)}
              id="array_width"
              max={width}
              min={0}
              unit="mm"
            />
          </div>
          <div className="control">
            <span className="text-center header">{lang.dy}</span>
            <UnitInput
              defaultValue={dy}
              getValue={(val) => handleChange('dy', val)}
              id="array_height"
              max={displayHeight || height}
              min={0}
              unit="mm"
            />
          </div>
        </div>
      </label>
    </div>
  );
};

export default Interval;
