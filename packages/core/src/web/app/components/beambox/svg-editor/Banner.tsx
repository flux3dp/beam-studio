import React, { useContext, useMemo } from 'react';

import { Flex } from 'antd';
import { useShallow } from 'zustand/react/shallow';

import { getAddOnInfo } from '@core/app/constants/addOn';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import useHasCurveEngraving from '@core/helpers/hooks/useHasCurveEngraving';
import useI18n from '@core/helpers/useI18n';

import styles from './Banner.module.scss';

// only beamo openBottom with rotary mode would provide 2 lines of banner
// beamo add-on openBottom, document setting borderless
const Banner = (): React.ReactNode => {
  const lang = useI18n();
  const { mode, selectedDevice } = useContext(CanvasContext);
  const hasCurveEngravingData = useHasCurveEngraving();
  const { autoFeeder, isBorderless, passThrough, rotaryMode, workarea } = useDocumentStore(
    useShallow((state) => ({
      autoFeeder: state['auto-feeder'],
      isBorderless: state.borderless,
      passThrough: state['pass-through'],
      rotaryMode: state.rotary_mode,
      workarea: state.workarea,
    })),
  );
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const isRotary = rotaryMode && addOnInfo.rotary;
  const isAutoFeeder = useMemo(
    () => getAutoFeeder(addOnInfo, { autoFeeder, borderless: isBorderless }),
    [addOnInfo, autoFeeder, isBorderless],
  );
  const isPassThrough = useMemo(
    () => getPassThrough(addOnInfo, { borderless: isBorderless, passThrough }),
    [addOnInfo, passThrough, isBorderless],
  );
  const isBorderlessPreview = useMemo(
    () => isBorderless && mode === CanvasMode.Preview && addOnInfo.openBottom && selectedDevice?.model === 'fbm1',
    [isBorderless, mode, addOnInfo.openBottom, selectedDevice],
  );
  const isCurveEngraving = useMemo(
    () => hasCurveEngravingData || mode === CanvasMode.CurveEngraving,
    [hasCurveEngravingData, mode],
  );
  const isAutoFocus = useMemo(() => mode === CanvasMode.AutoFocus, [mode]);
  const isNeedBanner =
    isAutoFeeder || isBorderlessPreview || isCurveEngraving || isPassThrough || isRotary || isAutoFocus;
  const messageMap = {
    autoFeeder: lang.beambox.banner.auto_feeder,
    autofocus1: lang.beambox.banner.autofocus1,
    autofocus2: lang.beambox.banner.autofocus2,
    curveEngraving: lang.beambox.banner.curve_engraving,
    openBottomPreview: `${lang.beambox.banner.camera_preview} ${lang.beambox.banner.camera_preview_borderless_mode}`,
    passThrough: lang.beambox.banner.pass_through,
    rotary: lang.beambox.banner.rotary,
  } as const;

  const renderBannerMessage = () => {
    const list = Array.of<string>();

    if (isBorderlessPreview) list.push(messageMap.openBottomPreview);

    // exclusive
    if (isAutoFeeder) list.push(messageMap.autoFeeder);
    else if (isPassThrough) list.push(messageMap.passThrough);
    else if (isCurveEngraving) list.push(messageMap.curveEngraving);
    else if (isRotary) list.push(messageMap.rotary);

    if (isAutoFocus) {
      list.push(messageMap.autofocus1);
      list.push(messageMap.autofocus2);
    }

    if (!list.length) return '';

    return (
      <Flex align="center" className={styles.flex} justify="center" vertical>
        {list.map((message) => (
          <div className={styles.text} key={`banner-${message}`}>
            {message}
          </div>
        ))}
      </Flex>
    );
  };

  return isNeedBanner ? <div className={styles.container}>{renderBannerMessage()}</div> : null;
};

export default Banner;
