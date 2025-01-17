import React, { createContext, Dispatch, SetStateAction, useMemo, useState } from 'react';

import beamboxPreference from 'app/actions/beambox/beambox-preference';
import { GuideMark } from 'interfaces/IPassThrough';
import { getWorkarea, WorkArea, WorkAreaModel } from 'app/constants/workarea-constants';

import sliceWorkarea from './sliceWorkarea';

interface Context {
  workarea: WorkAreaModel;
  workareaObj: WorkArea;
  passThroughHeight: number;
  setPassThroughHeight: Dispatch<SetStateAction<number>>;
  referenceLayer: boolean;
  setReferenceLayer: Dispatch<SetStateAction<boolean>>;
  guideMark: GuideMark;
  setGuideMark: Dispatch<SetStateAction<GuideMark>>;
  handleExport: () => Promise<void>;
}

export const PassThroughContext = createContext<Context>({
  workarea: 'ado1',
  workareaObj: getWorkarea('ado1'),
  passThroughHeight: 120,
  setPassThroughHeight: () => {},
  referenceLayer: false,
  setReferenceLayer: () => {},
  guideMark: { show: false, x: 0, width: 40 },
  setGuideMark: () => {},
  handleExport: async () => {},
});

interface Props {
  children: React.ReactNode;
}

export function PassThroughProvider({ children }: Props): JSX.Element {
  const workarea: WorkAreaModel = useMemo(() => beamboxPreference.read('workarea'), []);
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const [guideMark, setGuideMark] = useState<GuideMark>({ show: false, x: workareaObj.width - 40, width: 40 });
  const [passThroughHeight, setPassThroughHeight] = useState(
    workareaObj.passThroughMaxHeight ?? workareaObj.height
  );
  const [referenceLayer, setReferenceLayer] = useState(false);
  const handleExport = async () =>
    sliceWorkarea(passThroughHeight, { refLayers: referenceLayer, guideMark });

  return (
    <PassThroughContext.Provider
      value={{
        workarea,
        workareaObj,
        passThroughHeight,
        setPassThroughHeight,
        referenceLayer,
        setReferenceLayer,
        guideMark,
        setGuideMark,
        handleExport,
      }}
    >
      {children}
    </PassThroughContext.Provider>
  );
}
