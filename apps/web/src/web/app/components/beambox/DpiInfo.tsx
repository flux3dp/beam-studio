import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import useI18n from 'helpers/useI18n';
import { useIsMobile } from 'helpers/system-helper';

import styles from './DpiInfo.module.scss';

const eventEmitter = eventEmitterFactory.createEventEmitter('dpi-info');
const { dpiValueMap } = constant;
type TDpiKey = keyof typeof dpiValueMap;

// TODO: Rearrange corner info/buttons together
const DpiInfo = (): JSX.Element => {
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
