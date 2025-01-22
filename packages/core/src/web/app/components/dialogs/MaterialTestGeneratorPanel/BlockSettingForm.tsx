import React from 'react';

import { Flex } from 'antd';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import type { BlockSetting } from './BlockSetting';
import { blockSettingParams, blockSettingScopes } from './BlockSetting';
import styles from './Form.module.scss';

interface Props {
  blockSetting: BlockSetting;
  className?: string;
  handleChange: (blockSetting: BlockSetting) => void;
  isInch: boolean;
}

type Scope = (typeof blockSettingScopes)[number];
type Param = (typeof blockSettingParams)[number];

export default function BlockSettingForm({ blockSetting, className, handleChange, isInch }: Props): React.JSX.Element {
  const t = useI18n();
  const lengthUnit = isInch ? 'in' : 'mm';
  const handleValueChange = (scope: Scope, param: Param, value: number) => {
    const { max, min } = blockSetting[scope][param];

    handleChange({
      ...blockSetting,
      [scope]: {
        ...blockSetting[scope],
        [param]: { ...blockSetting[scope][param], value: Math.min(max, Math.max(min, value)) },
      },
    });
  };

  const renderInput = (scope: Scope, param: Param) => {
    const setting = blockSetting[scope][param];
    const useInch = isInch && param !== 'count';

    return (
      <UnitInput
        addonAfter={param === 'count' ? '' : lengthUnit}
        className={styles.input}
        data-testid={`${scope}-${param}`}
        isInch={useInch}
        key={`${scope}-${param}`}
        max={setting.max}
        min={setting.min}
        onChange={(value) => handleValueChange(scope, param, value)}
        precision={useInch ? 4 : 0}
        step={useInch ? 25.4 : 1}
        value={setting.value}
      />
    );
  };

  const renderColumn = (scope: Scope) => (
    <Flex gap="8px" justify="space-between" key={scope} vertical>
      <div className={styles['sub-title']}>{t.material_test_generator[scope === 'row' ? 'rows' : 'columns']}</div>
      {blockSettingParams.map((param) => renderInput(scope, param))}
    </Flex>
  );

  return (
    <Flex className={className} justify="space-between">
      <Flex gap="8px" justify="space-between" vertical>
        <div className={styles.title}>{t.material_test_generator.block_settings}</div>
        <div className={styles.label}>{t.material_test_generator.count}</div>
        <div className={styles.label}>{t.material_test_generator.size}</div>
        <div className={styles.label}>{t.material_test_generator.spacing}</div>
      </Flex>

      <Flex className={styles.inputs} gap="20px" justify="flex-end">
        {blockSettingScopes.map(renderColumn)}
      </Flex>
    </Flex>
  );
}
