import React, { useMemo } from 'react';

import { Alert, Flex } from 'antd';
import { match } from 'ts-pattern';

import { nxModelsArray } from '@core/app/actions/beambox/constant';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import useI18n from '@core/helpers/useI18n';

import styles from './StepIpAddress.module.scss';

interface StepIpAddressProps {
  model: WorkAreaModel;
}

const StepIpAddress = ({ model }: StepIpAddressProps): React.JSX.Element => {
  const lang = useI18n().connection_issue_guide.ip_address;
  const isVertical = useMemo(() => model === 'ado1', [model]);

  const imageSrcs = useMemo(() => {
    const suffix = match<WorkAreaModel, string>(model)
      .with('ado1', () => 'ador')
      .with(...nxModelsArray, () => 'nx')
      .otherwise(() => 'classic');

    return [
      `core-img/connection-issue-guide/connect-1-${suffix}.png`,
      `core-img/connection-issue-guide/ip-address-${suffix}.png`,
    ];
  }, [model]);

  return (
    <>
      <Flex gap={16} vertical={isVertical}>
        <div className={styles.image}>
          <img draggable="false" src={imageSrcs[0]} />
        </div>
        <div className={styles.image}>
          <img draggable="false" src={imageSrcs[1]} />
        </div>
      </Flex>
      <div className={styles.text}>
        <div className={styles.title}>{lang.title}</div>
        <div className={styles.steps}>
          <div className={styles.step}>{`1. ${lang.step1}`}</div>
          <div className={styles.step}>{`2. ${lang.step2}`}</div>
          <div className={styles.step}>{`3. ${lang.step3}`}</div>
        </div>
        <Alert message={lang.warning} showIcon type="warning" />
      </div>
    </>
  );
};

export default StepIpAddress;
