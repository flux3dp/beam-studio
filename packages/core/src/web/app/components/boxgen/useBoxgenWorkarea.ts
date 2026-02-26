import { useMemo } from 'react';

import { match } from 'ts-pattern';

import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getModuleBoundary } from '@core/app/constants/layer-module/module-boundary';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import { getDefaultModule } from '@core/helpers/layer-module/layer-module-helper';

export interface LengthUnit {
  decimal: number;
  unit: 'inch' | 'mm';
  unitRatio: number;
}

export interface BoxgenWorkarea {
  canvasHeight: number;
  canvasWidth: number;
  label: string;
  value: string;
}

interface BoxgenWorkareaResult {
  lengthUnit: LengthUnit;
  workarea: BoxgenWorkarea;
}

function useBoxgenWorkarea(): BoxgenWorkareaResult {
  const isInch = useStorageStore((state) => state.isInch);
  const workareaValue = useDocumentStore((state) => state.workarea);

  const lengthUnit: LengthUnit = useMemo(
    () =>
      isInch
        ? { decimal: 3, unit: 'inch' as const, unitRatio: 25.4 }
        : { decimal: 2, unit: 'mm' as const, unitRatio: 1 },
    [isInch],
  );

  const workarea = useMemo(() => {
    const currentWorkarea = getWorkarea(workareaValue, 'fbm1');
    const { displayHeight, height, width } = currentWorkarea;

    if (modelsWithModules.has(workareaValue)) {
      const defaultModule = getDefaultModule();
      const boundary = getModuleBoundary(workareaValue, defaultModule);
      const labelSuffix = match(defaultModule)
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

  return { lengthUnit, workarea };
}

export default useBoxgenWorkarea;
