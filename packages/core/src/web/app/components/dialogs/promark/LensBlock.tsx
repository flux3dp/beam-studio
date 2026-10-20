import type { Dispatch, SetStateAction } from 'react';
import React, { useCallback } from 'react';

import { Button, Flex } from 'antd';
import classNames from 'classnames';

import PromarkIcons from '@core/app/icons/promark/PromarkIcons';
import UnitInput from '@core/app/widgets/UnitInput';
import type { LensParameterIssues } from '@core/helpers/device/promark/validate-lens-parameters';
import useI18n from '@core/helpers/useI18n';
import type { GalvoParameters, LensCorrection } from '@core/interfaces/Promark';

import styles from './Block.module.scss';
import RangeTooltip from './RangeTooltip';

interface Props {
  data: GalvoParameters;
  issues?: LensParameterIssues;
  setData: Dispatch<SetStateAction<GalvoParameters>>;
}

const LensBlock = ({ data, issues, setData }: Props): React.JSX.Element => {
  const { promark_settings: t } = useI18n();
  const handleSwitch = useCallback(() => setData(({ x, y }) => ({ x: y, y: x })), [setData]);
  const { x, y } = data;

  return (
    <Flex className={styles['full-row']} gap={8} vertical>
      <div className={styles['lens-title']}>
        <div className={styles.title}>{t.galvo_configuration}</div>
        <div className={styles.connector} />
        <Button onClick={handleSwitch} size="small">
          {t.switchXY}
        </Button>
      </div>
      <Flex gap={40} justify="space-between">
        {[
          { axis: 'x' as const, source: x, title: 'X' },
          { axis: 'y' as const, source: y, title: 'Y' },
        ].map(({ axis, source: { bulge, scale, skew, trapezoid }, title }) => {
          const handleChange = (key: keyof LensCorrection, val: number) => {
            setData((cur) => ({ ...cur, [axis]: { ...cur[axis], [key]: val } }));
          };

          return (
            <Flex align="center" className={styles.block} gap={8} key={axis}>
              <div className={styles.subtitle}>{title}</div>
              <Flex className={classNames(styles.block, styles['left-border'])} gap={8} vertical>
                <Flex align="center" className={styles.row} justify="space-between">
                  <span className={styles.label}>{t.scale}</span>
                  <RangeTooltip issue={issues?.[`galvoParameters.${axis}.scale`]}>
                    <UnitInput
                      addonAfter="%"
                      className={styles.input}
                      clipValue={false}
                      data-testid={`scale-${axis}`}
                      onChange={(val) => handleChange('scale', val)}
                      precision={3}
                      size="small"
                      status={issues?.[`galvoParameters.${axis}.scale`]?.level}
                      value={scale}
                    />
                  </RangeTooltip>
                </Flex>
                <Flex align="center" className={styles.row} justify="space-between">
                  <span className={styles.label}>
                    <PromarkIcons.Bulge className={styles.icon} />
                    {t.bulge}
                  </span>
                  <RangeTooltip issue={issues?.[`galvoParameters.${axis}.bulge`]}>
                    <UnitInput
                      className={styles.input}
                      clipValue={false}
                      data-testid={`bulge-${axis}`}
                      onChange={(val) => handleChange('bulge', val)}
                      precision={3}
                      size="small"
                      status={issues?.[`galvoParameters.${axis}.bulge`]?.level}
                      step={0.001}
                      value={bulge}
                    />
                  </RangeTooltip>
                </Flex>
                <Flex align="center" className={styles.row} justify="space-between">
                  <span className={styles.label}>
                    <PromarkIcons.Skew className={styles.icon} />
                    {t.skew}
                  </span>
                  <RangeTooltip issue={issues?.[`galvoParameters.${axis}.skew`]}>
                    <UnitInput
                      className={styles.input}
                      clipValue={false}
                      data-testid={`skew-${axis}`}
                      onChange={(val) => handleChange('skew', val)}
                      precision={3}
                      size="small"
                      status={issues?.[`galvoParameters.${axis}.skew`]?.level}
                      step={0.001}
                      value={skew}
                    />
                  </RangeTooltip>
                </Flex>
                <Flex align="center" className={styles.row} justify="space-between">
                  <span className={styles.label}>
                    <PromarkIcons.Trapezoid className={styles.icon} />
                    {t.trapezoid}
                  </span>
                  <RangeTooltip issue={issues?.[`galvoParameters.${axis}.trapezoid`]}>
                    <UnitInput
                      className={styles.input}
                      clipValue={false}
                      data-testid={`trapezoid-${axis}`}
                      onChange={(val) => handleChange('trapezoid', val)}
                      precision={3}
                      size="small"
                      status={issues?.[`galvoParameters.${axis}.trapezoid`]?.level}
                      step={0.001}
                      value={trapezoid}
                    />
                  </RangeTooltip>
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
