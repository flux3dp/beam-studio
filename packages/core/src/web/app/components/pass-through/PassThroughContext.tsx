import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useMemo, useState } from 'react';

import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { WorkArea, WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import type { GuideMark } from '@core/interfaces/IPassThrough';

import sliceWorkarea from './sliceWorkarea';

interface Context {
  addOnInfo: AddOnInfo;
  guideMark: GuideMark;
  handleExport: () => Promise<void>;
  passThroughHeight: number;
  referenceLayer: boolean;
  setGuideMark: Dispatch<SetStateAction<GuideMark>>;
  setPassThroughHeight: Dispatch<SetStateAction<number>>;
  setReferenceLayer: Dispatch<SetStateAction<boolean>>;
  workarea: WorkAreaModel;
  workareaObj: WorkArea;
}

export const PassThroughContext = createContext<Context>({
  addOnInfo: getAddOnInfo('ado1'),
  guideMark: { show: false, width: 40, x: 0 },
  handleExport: async () => {},
  passThroughHeight: 120,
  referenceLayer: false,
  setGuideMark: () => {},
  setPassThroughHeight: () => {},
  setReferenceLayer: () => {},
  workarea: 'ado1',
  workareaObj: getWorkarea('ado1'),
});

interface Props {
  children: React.ReactNode;
}

export function PassThroughProvider({ children }: Props): React.JSX.Element {
  const workarea = useDocumentStore((state) => state.workarea);
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const [guideMark, setGuideMark] = useState<GuideMark>({
    show: false,
    width: 40,
    x: workareaObj.width - 40,
  });
  const [passThroughHeight, setPassThroughHeight] = useState(addOnInfo.passThrough?.maxHeight ?? workareaObj.height);
  const [referenceLayer, setReferenceLayer] = useState(false);
  const handleExport = async () =>
    sliceWorkarea(passThroughHeight, { addOnInfo, guideMark, refLayers: referenceLayer });

  return (
    <PassThroughContext
      value={{
        addOnInfo,
        guideMark,
        handleExport,
        passThroughHeight,
        referenceLayer,
        setGuideMark,
        setPassThroughHeight,
        setReferenceLayer,
        workarea,
        workareaObj,
      }}
    >
      {children}
    </PassThroughContext>
  );
}
