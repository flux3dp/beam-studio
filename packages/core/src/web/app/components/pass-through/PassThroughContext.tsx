import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useMemo, useState } from 'react';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { AddOnInfo } from '@core/app/constants/add-on';
import { getAddOnInfo } from '@core/app/constants/add-on';
import type { WorkArea, WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import type { GuideMark } from '@core/interfaces/IPassThrough';

import sliceWorkarea from './sliceWorkarea';

interface Context {
  guideMark: GuideMark;
  handleExport: () => Promise<void>;
  passThroughHeight: number;
  referenceLayer: boolean;
  setGuideMark: Dispatch<SetStateAction<GuideMark>>;
  setPassThroughHeight: Dispatch<SetStateAction<number>>;
  setReferenceLayer: Dispatch<SetStateAction<boolean>>;
  addOnInfo: AddOnInfo;
  workarea: WorkAreaModel;
  workareaObj: WorkArea;
}

export const PassThroughContext = createContext<Context>({
  guideMark: { show: false, width: 40, x: 0 },
  handleExport: async () => {},
  passThroughHeight: 120,
  referenceLayer: false,
  setGuideMark: () => {},
  setPassThroughHeight: () => {},
  setReferenceLayer: () => {},
  addOnInfo: getAddOnInfo('ado1'),
  workarea: 'ado1',
  workareaObj: getWorkarea('ado1'),
});

interface Props {
  children: React.ReactNode;
}

export function PassThroughProvider({ children }: Props): React.JSX.Element {
  const workarea: WorkAreaModel = useMemo(() => beamboxPreference.read('workarea'), []);
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const [guideMark, setGuideMark] = useState<GuideMark>({
    show: false,
    width: 40,
    x: workareaObj.width - 40,
  });
  const [passThroughHeight, setPassThroughHeight] = useState(addOnInfo.passThrough?.maxHeight ?? workareaObj.height);
  const [referenceLayer, setReferenceLayer] = useState(false);
  const handleExport = async () => sliceWorkarea(passThroughHeight, { guideMark, refLayers: referenceLayer });

  return (
    <PassThroughContext.Provider
      value={{
        guideMark,
        handleExport,
        passThroughHeight,
        referenceLayer,
        setGuideMark,
        setPassThroughHeight,
        setReferenceLayer,
        addOnInfo,
        workarea,
        workareaObj,
      }}
    >
      {children}
    </PassThroughContext.Provider>
  );
}
