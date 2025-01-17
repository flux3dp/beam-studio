/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import dialog from 'app/actions/dialog-caller';
import InitializeIcons from 'app/icons/initialize/InitializeIcons';
import isDev from 'helpers/is-dev';
import localeHelper from 'helpers/locale-helper';
import storage from 'implementations/storage';
import useI18n from 'helpers/useI18n';
import windowLocationReload from 'app/actions/windowLocation';
import { WorkAreaModel } from 'app/constants/workarea-constants';

import { isMobile } from 'helpers/system-helper';
import { useLocation } from 'react-router-dom';
import styles from './SelectMachineModel.module.scss';

type ModelItem = {
  model: WorkAreaModel;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon?: any;
  imageSrc?: string;
  btnClass?: string;
  labelClass?: string;
};

const SelectMachineModel = (): JSX.Element => {
  const t = useI18n().initialize;
  const { search } = useLocation();
  const isNewUser = useMemo(() => !storage.get('printer-is-ready'), []);
  const [isSelectBeambox, setIsSelectBeambox] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setIsSelectBeambox(new URLSearchParams(search).get('model') === 'fbb1p');
    };

    window.addEventListener('hashchange', handleHashChange);

    // Initial check
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [search]);

  const handleBtnClick = useCallback(() => {
    if (isNewUser) {
      storage.set('new-user', true);
    }

    if (isSelectBeambox) {
      window.location.hash = '#initialize/connect/select-machine-model';
      return;
    }

    storage.set('printer-is-ready', true);
    dialog.showLoadingWindow();
    window.location.hash = '#studio/beambox';
    windowLocationReload();
  }, [isNewUser, isSelectBeambox]);

  const handleNextClick = (model?: WorkAreaModel) => {
    // for beambox series, select different model in the next step
    if (model === 'fbb1p' && !isSelectBeambox) {
      window.location.hash = '#initialize/connect/select-machine-model?model=fbb1p';

      return;
    }

    // for promark, there is no connection type selection, go to connect-usb directly
    if (model === 'fpm1') {
      window.location.hash = `#initialize/connect/connect-usb?model=${model}`;

      return;
    }

    window.location.hash = `#initialize/connect/select-connection-type?model=${model}`;
  };

  const modelList: Array<ModelItem> = [
    { model: 'ado1', label: 'Ador', Icon: InitializeIcons.Ador } as const,
    { model: 'fbm1', label: 'beamo', Icon: InitializeIcons.Beamo } as const,
    {
      model: 'fbb1p',
      label: 'Beambox Series',
      Icon: InitializeIcons.Beambox,
      labelClass: styles.bb,
    } as const,
    { model: 'fhexa1', label: 'HEXA', Icon: InitializeIcons.Hexa } as const,
    !isMobile() &&
      (localeHelper.isTwOrHk || isDev()) &&
      ({ model: 'fpm1', label: 'Promark Series', Icon: InitializeIcons.Promark } as const),
  ].filter(Boolean);

  const beamboxModelList: Array<ModelItem> = useMemo(
    () =>
      [
        {
          model: 'fbb1p',
          label: 'Beambox (Pro)',
          imageSrc: 'core-img/init-panel/beambox-pro-real.png',
          btnClass: styles['btn-real'],
        } as const,
        (localeHelper.isTwOrHk || localeHelper.isJp || isDev()) &&
          ({
            model: 'fbb2',
            label: 'Beambox II',
            imageSrc: 'core-img/init-panel/beambox-2-real.png',
            btnClass: styles['btn-real'],
          } as const),
      ].filter(Boolean),
    []
  );

  const selectTitle = useMemo(
    () => (isSelectBeambox ? t.select_beambox : t.select_machine_type),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSelectBeambox]
  );
  const currentList = useMemo(
    () => (isSelectBeambox ? beamboxModelList : modelList),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSelectBeambox]
  );

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />
      <div className={styles.btns}>
        <div className={styles.btn} onClick={handleBtnClick}>
          {isNewUser ? t.skip : t.back}
        </div>
      </div>
      <div className={styles.main}>
        <h1 className={styles.title}>{selectTitle}</h1>
        <div className={styles.btns}>
          {currentList.map(({ model, label, Icon, imageSrc, btnClass, labelClass }) => (
            <div
              key={model}
              className={classNames(styles.btn, btnClass)}
              onClick={() => handleNextClick(model)}
            >
              {Icon && <Icon className={styles.icon} />}
              {imageSrc && <img className={styles.image} src={imageSrc} draggable="false" />}
              <div className={classNames(styles.label, labelClass)}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectMachineModel;
