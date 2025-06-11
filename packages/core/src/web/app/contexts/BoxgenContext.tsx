import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useMemo, useState } from 'react';

import { match } from 'ts-pattern';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { DEFAULT_CONTROLLER_INCH, DEFAULT_CONTROLLER_MM } from '@core/app/constants/boxgen-constants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getModuleBoundary } from '@core/app/constants/layer-module/module-boundary';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { getDefaultLaserModule } from '@core/helpers/layer-module/layer-module-helper';
import storage from '@core/implementations/storage';
import type { IController } from '@core/interfaces/IBoxgen';

import { modelsWithModules } from '../actions/beambox/constant';

interface BoxgenContextType {
  boxData: IController;
  lengthUnit: { decimal: number; unit: 'inch' | 'mm'; unitRatio: number };
  onClose: () => void;
  setBoxData: Dispatch<SetStateAction<IController>>;
  workarea: { canvasHeight: number; canvasWidth: number; label: string; value: string };
}

export const BoxgenContext = createContext<BoxgenContextType>({
  boxData: DEFAULT_CONTROLLER_MM,
  lengthUnit: { decimal: 0, unit: 'mm', unitRatio: 1 },
  onClose: () => {},
  setBoxData: () => {},
  workarea: { canvasHeight: 210, canvasWidth: 300, label: 'beamo', value: 'fbm1' },
});

interface BoxgenProviderProps {
  children: React.ReactNode;
  onClose: () => void;
}

export function BoxgenProvider({ children, onClose }: BoxgenProviderProps): React.JSX.Element {
  const workareaValue: WorkAreaModel = BeamboxPreference.read('workarea') || 'fbm1';
  const workarea = useMemo(() => {
    const currentWorkarea = getWorkarea(workareaValue, 'fbm1');
    const { displayHeight, height, width } = currentWorkarea;

    if (modelsWithModules.has(workareaValue)) {
      const laserModule = getDefaultLaserModule();
      const boundary = getModuleBoundary(workareaValue, laserModule);
      const labelSuffix = match(laserModule)
        .with(LayerModule.LASER_10W_DIODE, () => ' 10W')
        .with(LayerModule.LASER_20W_DIODE, () => ' 20W')
        .otherwise(() => '');

      return {
        canvasHeight: (displayHeight ?? height) - boundary.top - boundary.bottom,
        canvasWidth: width - boundary.left - boundary.right,
        label: `${currentWorkarea.label}${labelSuffix}`,
        value: workareaValue,
      };
    }

    return {
      canvasHeight: displayHeight ?? height,
      canvasWidth: width,
      label: currentWorkarea.label,
      value: workareaValue,
    };
  }, [workareaValue]);

  const unit = storage.get('default-units') || 'mm';
  const isMM = unit === 'mm';
  const lengthUnit = isMM
    ? { decimal: 0, unit: 'mm' as const, unitRatio: 1 }
    : { decimal: 3, unit: 'inch' as const, unitRatio: 25.4 };

  const [boxData, setBoxData] = useState(isMM ? DEFAULT_CONTROLLER_MM : DEFAULT_CONTROLLER_INCH);

  return (
    <BoxgenContext.Provider
      value={{
        boxData,
        lengthUnit,
        onClose,
        setBoxData,
        workarea,
      }}
    >
      {children}
    </BoxgenContext.Provider>
  );
}
