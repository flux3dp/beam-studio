import classNames from 'classnames';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { Button, Flex } from 'antd';

import PromarkIcons from 'app/icons/promark/PromarkIcons';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { GalvoParameters, LensCorrection } from 'interfaces/Promark';

import styles from './Block.module.scss';

interface Props {
  data: GalvoParameters;
  setData: Dispatch<SetStateAction<GalvoParameters>>;
}

const LensBlock = ({ data, setData }: Props): JSX.Element => {
  const { promark_settings: t } = useI18n();
  const handleSwitch = useCallback(() => setData(({ x, y }) => ({ x: y, y: x })), [setData]);
  const { x, y } = data;

  return (
    <Flex vertical className={styles['full-row']} gap={8}>
      <div className={styles['lens-title']}>
        <div className={styles.title}>{t.galvo_configuration}</div>
        <div className={styles.connector} />
        <Button size="small" onClick={handleSwitch}>
          {t.switchXY}
        </Button>
      </div>
      <Flex gap={40} justify="space-between">
        {[
          { axis: 'x', source: x, title: 'X' },
          { axis: 'y', source: y, title: 'Y' },
        ].map(({ axis, source: { scale, bulge, skew, trapezoid }, title }) => {
          const handleChange = (key: keyof LensCorrection, val: number) => {
            setData((cur) => ({ ...cur, [axis]: { ...cur[axis], [key]: val } }));
          };
          return (
            <Flex key={axis} className={styles.block} align="center" gap={8}>
              <div className={styles.subtitle}>{title}</div>
              <Flex className={classNames(styles.block, styles['left-border'])} vertical gap={8}>
                <Flex className={styles.row} justify="space-between" align="center">
                  <span className={styles.label}>{t.scale}</span>
                  <UnitInput
                    data-testid={`scale-${axis}`}
                    className={styles.input}
                    size="small"
                    value={scale}
                    precision={3}
                    addonAfter="%"
                    onChange={(val) => handleChange('scale', val)}
                  />
                </Flex>
                <Flex className={styles.row} justify="space-between" align="center">
                  <span className={styles.label}>
                    <PromarkIcons.Bulge className={styles.icon} />
                    {t.bulge}
                  </span>
                  <UnitInput
                    data-testid={`bulge-${axis}`}
                    className={styles.input}
                    size="small"
                    value={bulge}
                    precision={3}
                    step={0.001}
                    onChange={(val) => handleChange('bulge', val)}
                  />
                </Flex>
                <Flex className={styles.row} justify="space-between" align="center">
                  <span className={styles.label}>
                    <PromarkIcons.Skew className={styles.icon} />
                    {t.skew}
                  </span>
                  <UnitInput
                    data-testid={`skew-${axis}`}
                    className={styles.input}
                    size="small"
                    value={skew}
                    precision={3}
                    step={0.001}
                    onChange={(val) => handleChange('skew', val)}
                  />
                </Flex>
                <Flex className={styles.row} justify="space-between" align="center">
                  <span className={styles.label}>
                    <PromarkIcons.Trapezoid className={styles.icon} />
                    {t.trapezoid}
                  </span>
                  <UnitInput
                    data-testid={`trapezoid-${axis}`}
                    className={styles.input}
                    size="small"
                    value={trapezoid}
                    precision={3}
                    step={0.001}
                    onChange={(val) => handleChange('trapezoid', val)}
                  />
                </Flex>
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
};

export default LensBlock;
