import React, { useState } from 'react';
import { Divider, Flex, Radio, RadioChangeEvent, Space } from 'antd';
import classNames from 'classnames';

import useI18n from 'helpers/useI18n';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import { laserSourceWattMap, LaserType, workareaOptions } from 'app/constants/promark-constants';

import { setPromarkInfo } from 'helpers/device/promark/promark-info';
import { PromarkInfo } from 'interfaces/Promark';

import styles from './index.module.scss';

export default function ChoosePromarkLaserSource(): JSX.Element {
  const { initialize: t } = useI18n();
  const [laserSource, setLaserSource] = useState('');
  const [workarea, setWorkarea] = useState(0);

  const generateLaserSourceOptions = (source: keyof typeof laserSourceWattMap) =>
    laserSourceWattMap[source].map((watt: number) => ({
      label: `${source} - ${watt}W`,
      value: `${source}-${watt}`,
    }));
  const generateWorkareaOptions = () =>
    workareaOptions.map((area) => ({ label: `${area}x${area}`, value: area }));

  const renderLaserSourceRadio = (options: ReturnType<typeof generateLaserSourceOptions>) => (
    <Space direction="vertical">
      {options.map(({ label, value }) => (
        <Radio key={value} value={value}>
          {label}
        </Radio>
      ))}
    </Space>
  );

  const onLaserSourceChange = ({ target: { value } }: RadioChangeEvent) => {
    setLaserSource(value);

    // setup 110mm for Promark MOPA 20W by default, otherwise 220mm
    if (value === 'MOPA-20') {
      setWorkarea(110);
    } else {
      setWorkarea(220);
    }
  };
  const onWorkareaChange = (e: RadioChangeEvent) => setWorkarea(e.target.value);

  const handleNext = () => {
    const customizedDimension = beamboxPreference.read('customized-dimension') ?? {};
    const [source, watt] = laserSource.split('-');

    beamboxPreference.write('customized-dimension', {
      ...customizedDimension,
      fpm1: { width: workarea, height: workarea },
    });

    setPromarkInfo({ laserType: LaserType[source], watt: Number(watt) } as PromarkInfo);

    window.location.hash = `#initialize/connect/promark-settings`;
  };

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />

      <Flex justify="space-between" gap={40}>
        <div className={styles.image}>
          <img
            src="core-img/init-panel/promark-real.png"
            draggable="false"
            width={300}
            height={300}
          />
        </div>

        <Flex vertical>
          <div className={styles['mb-32px']}>
            <div className={styles.title}>{t.promark.select_laser_source}</div>
            <Flex>
              <Radio.Group onChange={onLaserSourceChange} value={laserSource}>
                <Space split={<Divider type="vertical" className={styles['space-divider']} />}>
                  {renderLaserSourceRadio(generateLaserSourceOptions('Desktop'))}
                  {renderLaserSourceRadio(generateLaserSourceOptions('MOPA'))}
                </Space>
              </Radio.Group>
            </Flex>
          </div>

          <div>
            <div className={classNames(styles.subtitle, styles['mb-12px'])}>
              {t.promark.select_workarea}
            </div>
            <Flex>
              <Radio.Group
                onChange={onWorkareaChange}
                options={generateWorkareaOptions()}
                value={workarea}
              />
            </Flex>
          </div>
        </Flex>
      </Flex>

      <div className={styles.btns}>
        <div className={styles.btn} onClick={() => window.history.back()}>
          {t.back}
        </div>
        <div
          className={classNames(styles.btn, styles.primary, { [styles.disabled]: !laserSource })}
          onClick={handleNext}
        >
          {t.next}
        </div>
      </div>
    </div>
  );
}
