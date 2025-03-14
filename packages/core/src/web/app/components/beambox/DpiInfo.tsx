import React, { useEffect, useState } from 'react';

import classNames from 'classnames';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './DpiInfo.module.scss';

const eventEmitter = eventEmitterFactory.createEventEmitter('dpi-info');
// eslint-disable-next-line ts/no-unused-vars
const { dpiValueMap } = constant;

type TDpiKey = keyof typeof dpiValueMap;

// TODO: Rearrange corner info/buttons together
const DpiInfo = (): React.JSX.Element => {
  const lang = useI18n().beambox.document_panel;
  const [engraveDpi, setEngraveDpi] = useState<TDpiKey>(BeamboxPreference.read('engrave_dpi'));
  const isMobile = useIsMobile();

  useEffect(() => {
    eventEmitter.on('UPDATE_DPI', setEngraveDpi);

    return () => {
      eventEmitter.off('UPDATE_DPI', setEngraveDpi);
    };
  }, []);

  return (
    <div className={classNames(styles.container, { [styles.mobile]: isMobile })}>
      <i>
        {lang.engrave_dpi}: {constant.dpiValueMap[engraveDpi]} DPI
      </i>
    </div>
  );
};

export default DpiInfo;
