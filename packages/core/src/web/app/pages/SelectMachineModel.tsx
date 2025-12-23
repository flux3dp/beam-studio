import React, { useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { useLocation } from 'react-router-dom';

import dialog from '@core/app/actions/dialog-caller';
import windowLocationReload from '@core/app/actions/windowLocation';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import InitializeIcons from '@core/app/icons/initialize/InitializeIcons';
import { checkBM2, checkFpm1 } from '@core/helpers/checkFeature';
import { getHomePage } from '@core/helpers/hashHelper';
import { isMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';

import styles from './SelectMachineModel.module.scss';

type ModelItem = {
  btnClass?: string;
  Icon?: any;
  imageSrc?: string;
  label: string;
  labelClass?: string;
  model: WorkAreaModel;
};

const SelectMachineModel = (): React.JSX.Element => {
  const t = useI18n().initialize;
  const { search } = useLocation();
  const isNewUser = useMemo(() => !storage.get('printer-is-ready'), []);
  const [isSelectBeambox, setIsSelectBeambox] = useState(false);
  const [isSelectBeamo, setIsSelectBeamo] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const model = new URLSearchParams(search).get('model') as null | WorkAreaModel;

      if (model === 'fbb1p') {
        setIsSelectBeambox(true);
        setIsSelectBeamo(false);
      } else if (model === 'fbm1') {
        setIsSelectBeambox(false);
        setIsSelectBeamo(true);
      } else {
        setIsSelectBeambox(false);
        setIsSelectBeamo(false);
      }
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

    if (isSelectBeambox || isSelectBeamo) {
      window.location.hash = '#/initialize/connect/select-machine-model';

      return;
    }

    storage.set('printer-is-ready', true);
    dialog.showLoadingWindow();
    window.location.hash = getHomePage();
    windowLocationReload();
  }, [isNewUser, isSelectBeambox, isSelectBeamo]);

  const handleNextClick = (model?: WorkAreaModel) => {
    // for series, select different model in the next step
    if ((model === 'fbb1p' && !isSelectBeambox) || (model === 'fbm1' && checkBM2() && !isSelectBeamo)) {
      window.location.hash = `#/initialize/connect/select-machine-model?model=${model}`;

      return;
    }

    // for promark, there is no connection type selection, go to connect-usb directly
    if (model === 'fpm1') {
      window.location.hash = `#/initialize/connect/connect-usb?model=${model}`;

      return;
    }

    window.location.hash = `#/initialize/connect/select-connection-type?model=${model}`;
  };

  const modelList: ModelItem[] = [
    { Icon: InitializeIcons.Ador, label: 'Ador', model: 'ado1' },
    { Icon: InitializeIcons.Beamo, label: checkBM2() ? 'beamo Series' : 'beamo', labelClass: styles.bb, model: 'fbm1' },
    {
      Icon: InitializeIcons.Beambox,
      label: 'Beambox Series',
      labelClass: styles.bb,
      model: 'fbb1p',
    },
    { Icon: InitializeIcons.Hexa, label: 'HEXA', model: 'fhexa1' },
    !isMobile() && checkFpm1() && { Icon: InitializeIcons.Promark, label: 'Promark Series', model: 'fpm1' },
  ].filter(Boolean) as ModelItem[];

  const beamboxModelList: ModelItem[] = useMemo(
    () => [
      {
        btnClass: styles['btn-real'],
        imageSrc: 'core-img/init-panel/beambox-pro-real.png',
        label: 'Beambox (Pro)',
        model: 'fbb1p',
      },
      {
        btnClass: styles['btn-real'],
        imageSrc: 'core-img/init-panel/beambox-2-real.png',
        label: 'Beambox II',
        model: 'fbb2',
      },
    ],
    [],
  );

  const beamoModelList: ModelItem[] = useMemo(
    () => [
      {
        btnClass: styles['btn-real'],
        imageSrc: 'core-img/init-panel/beamo-real.webp',
        label: 'beamo',
        model: 'fbm1',
      },
      {
        btnClass: styles['btn-real'],
        imageSrc: 'core-img/init-panel/beamo2-real.webp',
        label: 'beamo II',
        model: 'fbm2',
      },
    ],
    [],
  );

  const selectTitle = useMemo(
    () => (isSelectBeambox ? t.select_beambox : isSelectBeamo ? t.select_beamo : t.select_machine_type),
    // eslint-disable-next-line hooks/exhaustive-deps
    [isSelectBeambox, isSelectBeamo],
  );
  const currentList = useMemo(
    () => (isSelectBeambox ? beamboxModelList : isSelectBeamo ? beamoModelList : modelList),
    // eslint-disable-next-line hooks/exhaustive-deps
    [isSelectBeambox, isSelectBeamo],
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
          {currentList.map(({ btnClass, Icon, imageSrc, label, labelClass, model }) => (
            <div className={classNames(styles.btn, btnClass)} key={model} onClick={() => handleNextClick(model)}>
              {Icon && <Icon className={styles.icon} />}
              {imageSrc && <img className={styles.image} draggable="false" src={imageSrc} />}
              <div className={classNames(styles.label, labelClass)}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectMachineModel;
