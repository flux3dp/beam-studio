import React, { useContext, useMemo } from 'react';

import { Flex } from 'antd';

import { getAddOnInfo } from '@core/app/constants/addOn';
import CanvasMode from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import { useBeamboxPreference } from '@core/helpers/hooks/useBeamboxPreference';
import useHasCurveEngraving from '@core/helpers/hooks/useHasCurveEngraving';
import useI18n from '@core/helpers/useI18n';

import styles from './Banner.module.scss';

// only beamo openBottom with rotary mode would provide 2 lines of banner
// beamo add-on openBottom, document setting borderless

const Banner = (): React.ReactNode => {
  const lang = useI18n();
  const { mode, selectedDevice } = useContext(CanvasContext);
  const hasCurveEngravingData = useHasCurveEngraving();
  const workarea = useBeamboxPreference('workarea');
  const isBorderless = useBeamboxPreference('borderless');
  const addOnInfo = useMemo(() => getAddOnInfo(workarea), [workarea]);
  const isRotary = useBeamboxPreference('rotary_mode') && addOnInfo.rotary;
  const passThrough = useBeamboxPreference('pass-through');
  const autoFeeder = useBeamboxPreference('auto-feeder');
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
  const isNeedBanner = isAutoFeeder || isBorderlessPreview || isCurveEngraving || isPassThrough || isRotary;
  const messageMap = {
    autoFeeder: lang.beambox.banner.auto_feeder,
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
