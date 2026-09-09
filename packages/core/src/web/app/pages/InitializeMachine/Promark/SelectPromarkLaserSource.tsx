import React, { useState } from 'react';

import type { RadioChangeEvent } from 'antd';
import { Divider, Flex, Radio, Space } from 'antd';
import classNames from 'classnames';

import {
  getDefaultPromarkWorkarea,
  getPromarkWorkareaOptions,
  laserSourceWattMap,
  LaserType,
  laserTypes,
} from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { setPromarkInfo } from '@core/helpers/device/promark/promark-info';
import useI18n from '@core/helpers/useI18n';
import type { PromarkInfo } from '@core/interfaces/Promark';

import SetupPageLayout from '../Components/SetupPageLayout';

import styles from './SelectPromarkLaserSource.module.scss';

export default function ChoosePromarkLaserSource(): React.JSX.Element {
  const { initialize: t } = useI18n();
  const [laserSource, setLaserSource] = useState('');
  const [workarea, setWorkarea] = useState(0);
  const promarkSafe = useDocumentStore((state) => !!state['workarea-annotation']?.fpm1?.safe);

  const generateLaserSourceOptions = (source: keyof typeof laserSourceWattMap) =>
    laserSourceWattMap[source].map((watt: number) => ({
      label: `${source} - ${watt}W`,
      value: `${source}-${watt}`,
    }));
  const getSelectedPromarkInfo = (value: string): PromarkInfo => {
    const [source, watt] = value.split('-') as [keyof typeof laserSourceWattMap, string];

    return { laserType: LaserType[source], watt: Number(watt) };
  };
  const generateWorkareaOptions = () => {
    if (!laserSource) return [];

    return getPromarkWorkareaOptions(getSelectedPromarkInfo(laserSource).laserType).map((area) => ({
      label: `${area}x${area}`,
      value: area,
    }));
  };

  const renderLaserSourceRadio = (source: keyof typeof laserSourceWattMap) => (
    <Space direction="vertical" key={source}>
      {generateLaserSourceOptions(source).map(({ label, value }) => (
        <Radio key={value} value={value}>
          {label}
        </Radio>
      ))}
    </Space>
  );

  const onLaserSourceChange = ({ target: { value } }: RadioChangeEvent) => {
    setLaserSource(value);
    setWorkarea(getDefaultPromarkWorkarea(getSelectedPromarkInfo(value)));
  };
  const onWorkareaChange = (e: RadioChangeEvent) => setWorkarea(e.target.value);

  const handleNext = () => {
    const { 'customized-dimension': customizedDimension, set } = useDocumentStore.getState();
    const promarkInfo = getSelectedPromarkInfo(laserSource);

    set('customized-dimension', {
      ...customizedDimension,
      fpm1: { height: workarea, width: workarea },
    });

    setPromarkInfo(promarkInfo);

    window.location.hash = `#/initialize/connect/promark-settings`;
  };

  return (
    <SetupPageLayout
      buttons={[
        { label: t.back, onClick: () => window.history.back() },
        { disabled: !laserSource, label: t.next, onClick: handleNext, primary: true },
      ]}
    >
      <Flex gap={40} justify="space-between">
        <div className={styles.image}>
          <img
            draggable="false"
            height={300}
            src={promarkSafe ? 'core-img/init-panel/promark-safe-real.png' : 'core-img/init-panel/promark-real.png'}
            width={300}
          />
        </div>

        <Flex vertical>
          <div className={styles['mb-32px']}>
            <div className={styles.title}>{t.promark.select_laser_source}</div>
            <Flex>
              <Radio.Group onChange={onLaserSourceChange} value={laserSource}>
                <Space split={<Divider className={styles['space-divider']} type="vertical" />}>
                  {laserTypes.map((type) => renderLaserSourceRadio(type))}
                </Space>
              </Radio.Group>
            </Flex>
          </div>

          <div>
            <div className={classNames(styles.subtitle, styles['mb-12px'])}>{t.promark.select_workarea}</div>
            <Flex>
              <Radio.Group onChange={onWorkareaChange} options={generateWorkareaOptions()} value={workarea} />
            </Flex>
          </div>
        </Flex>
      </Flex>
    </SetupPageLayout>
  );
}
