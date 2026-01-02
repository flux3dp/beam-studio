import React, { useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';
import { match } from 'ts-pattern';

import dialog from '@core/app/actions/dialog-caller';
import windowLocationReload from '@core/app/actions/windowLocation';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import InitializeIcons from '@core/app/icons/initialize/InitializeIcons';
import { checkBM2, checkFpm1, checkHxRf } from '@core/helpers/checkFeature';
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
  model?: WorkAreaModel;
  type?: SelectedModelType;
};

type SelectedModelType = '' | 'beambox' | 'beamo' | 'hexa';

const SelectMachineModel = (): React.JSX.Element => {
  const t = useI18n().initialize;
  const isNewUser = useMemo(() => !storage.get('printer-is-ready'), []);
  const [selectedModelType, setSelectedModelType] = useState<SelectedModelType>('');

  const handleBtnClick = useCallback(() => {
    if (selectedModelType !== '') {
      setSelectedModelType('');

      return;
    }

    if (isNewUser) {
      storage.set('new-user', true);
    }

    storage.set('printer-is-ready', true);
    dialog.showLoadingWindow();
    window.location.hash = getHomePage();
    windowLocationReload();
  }, [isNewUser, selectedModelType]);

  const handleNextClick = ({ model, type }: { model?: WorkAreaModel; type?: SelectedModelType }) => {
    if (type) {
      setSelectedModelType(type);

      return;
    }

    // for promark, there is no connection type selection, go to connect-usb directly
    if (model === 'fpm1') {
      window.location.hash = `#/initialize/connect/connect-usb?model=${model}`;

      return;
    }

    window.location.hash = `#/initialize/connect/select-connection-type?model=${model}`;
  };

  const modelList = useMemo(() => {
    const supportBm2 = checkBM2();
    const supportHxRf = checkHxRf();

    return [
      { Icon: InitializeIcons.Ador, label: 'Ador', model: 'ado1' },
      {
        Icon: InitializeIcons.Beamo,
        label: supportBm2 ? 'beamo Series' : 'beamo',
        labelClass: styles.bb,
        model: supportBm2 ? undefined : 'fbm1',
        type: supportBm2 ? 'beamo' : undefined,
      },
      {
        Icon: InitializeIcons.Beambox,
        label: 'Beambox Series',
        labelClass: styles.bb,
        type: 'beambox',
      },
      {
        Icon: InitializeIcons.Hexa,
        label: supportHxRf ? 'HEXA Series' : 'HEXA',
        model: supportHxRf ? undefined : 'fhexa1',
        type: supportHxRf ? 'hexa' : undefined,
      },
      !isMobile() && checkFpm1() && { Icon: InitializeIcons.Promark, label: 'Promark Series', model: 'fpm1' },
    ].filter(Boolean) as ModelItem[];
  }, []);

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

  const hexaModelList: ModelItem[] = useMemo(
    () => [
      {
        btnClass: styles['btn-real'],
        imageSrc: 'core-img/init-panel/hexa-real.png',
        label: 'HEXA',
        model: 'fhexa1',
      },
      {
        btnClass: styles['btn-real'],
        // TODO: replace with hexa rf image when available
        imageSrc: 'core-img/init-panel/hexa-real.png',
        label: 'HEXA RF',
        model: 'fhx2rf',
      },
    ],
    [],
  );

  const { list: currentList, title: selectTitle } = useMemo(() => {
    return match(selectedModelType)
      .with('beambox', () => ({
        list: beamboxModelList,
        title: t.select_beambox,
      }))
      .with('beamo', () => ({
        list: beamoModelList,
        title: t.select_beamo,
      }))
      .with('hexa', () => ({
        list: hexaModelList,
        title: t.select_hexa,
      }))
      .otherwise(() => ({
        list: modelList,
        title: t.select_machine_type,
      }));
  }, [selectedModelType, beamboxModelList, beamoModelList, hexaModelList, modelList, t]);

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
          {currentList.map(({ btnClass, Icon, imageSrc, label, labelClass, model, type }) => (
            <div
              className={classNames(styles.btn, btnClass)}
              key={type ?? model}
              onClick={() => handleNextClick({ model, type })}
            >
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
