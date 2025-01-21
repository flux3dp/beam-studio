import React, { createContext, Dispatch, SetStateAction, useMemo, useState } from 'react';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import layerModuleHelper from '@core/helpers/layer-module/layer-module-helper';
import moduleBoundary from '@core/app/constants/layer-module/module-boundary';
import storage from '@app/implementations/storage';
import {
  DEFAULT_CONTROLLER_INCH,
  DEFAULT_CONTROLLER_MM,
} from '@core/app/constants/boxgen-constants';
import { getWorkarea, WorkAreaModel } from '@core/app/constants/workarea-constants';
import { IController } from '@core/interfaces/IBoxgen';

interface BoxgenContextType {
  onClose: () => void;
  boxData: IController;
  setBoxData: Dispatch<SetStateAction<IController>>;
  workarea: { value: string; label: string; canvasWidth: number; canvasHeight: number };
  lengthUnit: { unit: 'mm' | 'inch'; unitRatio: number; decimal: number };
}

export const BoxgenContext = createContext<BoxgenContextType>({
  onClose: () => {},
  boxData: DEFAULT_CONTROLLER_MM,
  setBoxData: () => {},
  workarea: { value: 'fbm1', label: 'beamo', canvasWidth: 300, canvasHeight: 210 },
  lengthUnit: { unit: 'mm', unitRatio: 1, decimal: 0 },
});

interface BoxgenProviderProps {
  onClose: () => void;
  children: React.ReactNode;
}

export function BoxgenProvider({ onClose, children }: BoxgenProviderProps): JSX.Element {
  const workareaValue: WorkAreaModel = BeamboxPreference.read('workarea') || 'fbm1';
  const workarea = useMemo(() => {
    const currentWorkarea = getWorkarea(workareaValue, 'fbm1');
    const { width, height, displayHeight } = currentWorkarea;
    if (workareaValue === 'ado1') {
      const laserModule = layerModuleHelper.getDefaultLaserModule();
      const boundary = moduleBoundary[laserModule];
      return {
        value: workareaValue,
        label: `${currentWorkarea.label} ${
          laserModule === LayerModule.LASER_10W_DIODE ? '10W' : '20W'
        }`,
        canvasWidth: width - boundary.left - boundary.right,
        canvasHeight: (displayHeight ?? height) - boundary.top - boundary.bottom,
      };
    }
    return {
      value: workareaValue,
      label: currentWorkarea.label,
      canvasWidth: width,
      canvasHeight: displayHeight ?? height,
    };
  }, [workareaValue]);

  const unit = storage.get('default-units') || 'mm';
  const isMM = unit === 'mm';
  const lengthUnit = isMM
    ? { unit: 'mm' as const, unitRatio: 1, decimal: 0 }
    : { unit: 'inch' as const, unitRatio: 25.4, decimal: 3 };

  const [boxData, setBoxData] = useState(isMM ? DEFAULT_CONTROLLER_MM : DEFAULT_CONTROLLER_INCH);

  return (
    <BoxgenContext.Provider
      value={{
        onClose,
        boxData,
        setBoxData,
        workarea,
        lengthUnit,
      }}
    >
      {children}
    </BoxgenContext.Provider>
  );
}
