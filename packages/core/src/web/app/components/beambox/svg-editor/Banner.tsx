import React, { useContext, useMemo } from 'react';

import { Flex } from 'antd';

import { getSupportInfo } from '@core/app/constants/add-on';
import CanvasMode from '@core/app/constants/canvasMode';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import useBeamboxPreference from '@core/helpers/hooks/useBeamboxPreference';
import useHasCurveEngraving from '@core/helpers/hooks/useHasCurveEngraving';
import useI18n from '@core/helpers/useI18n';

import styles from './Banner.module.scss';

// only beamo openBottom with rotary mode would provide 2 lines of banner
// beamo add-on openBottom, document setting borderless

const Banner = (): React.ReactNode => {
  const lang = useI18n();
  const { mode, selectedDevice } = useContext(CanvasContext);
  const hasCurveEngravingData = useHasCurveEngraving();
  const workarea = useBeamboxPreference<WorkAreaModel>('workarea');
  const isBorderless = useBeamboxPreference('borderless');
  const supportInfo = useMemo(() => getSupportInfo(workarea), [workarea]);
  const isRotary = useBeamboxPreference('rotary_mode') && supportInfo.rotary;
  const isAutoFeeder = useBeamboxPreference('auto-feeder') && supportInfo.autoFeeder;
  const isBorderlessPreview = useMemo(
    () => isBorderless && mode === CanvasMode.Preview && supportInfo.openBottom && selectedDevice?.model === 'fbm1',
    [isBorderless, mode, supportInfo.openBottom, selectedDevice],
  );
  const isCurveEngraving = useMemo(
    () => hasCurveEngravingData || mode === CanvasMode.CurveEngraving,
    [hasCurveEngravingData, mode],
  );
  const isNeedBanner = isRotary || isAutoFeeder || isCurveEngraving || isBorderlessPreview;
  const messageMap = {
    autoFeeder: lang.beambox.banner.auto_feeder,
    curveEngraving: lang.beambox.banner.curve_engraving,
    fbm1Preview: `${lang.beambox.banner.camera_preview} ${lang.beambox.banner.camera_preview_borderless_mode}`,
    rotary: lang.beambox.banner.rotary,
  } as const;

  const renderBannerMessage = () => {
    const list = Array.of<string>();

    if (isBorderlessPreview) list.push(messageMap.fbm1Preview);

    // exclusive
    if (isAutoFeeder) list.push(messageMap.autoFeeder);
    else if (isCurveEngraving) list.push(messageMap.curveEngraving);
    else if (isRotary) list.push(messageMap.rotary);

    if (!list.length) return '';

    return (
      <Flex align="center" className={styles.flex} justify="center" vertical>
        {list.map((message) => (
          <div className={styles.text}>{message}</div>
        ))}
      </Flex>
    );
  };

  return isNeedBanner ? <div className={styles.container}>{renderBannerMessage()}</div> : null;
};

export default Banner;
