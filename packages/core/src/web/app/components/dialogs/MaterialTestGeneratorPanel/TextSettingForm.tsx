import React, { useMemo } from 'react';

import { Flex } from 'antd';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/UnitInput';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getDefaultModule } from '@core/helpers/layer-module/layer-module-helper';
import { usePresetList } from '@core/helpers/presets/preset-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Form.module.scss';
import type { textParams, TextSetting } from './TextSetting';

interface Props {
  className?: string;
  handleChange: (textSetting: TextSetting) => void;
  isInch: boolean;
  setting: TextSetting;
}

type Param = (typeof textParams)[number];

export default function TextSettingForm({ className, handleChange, isInch, setting }: Props): React.JSX.Element {
  const {
    beambox: {
      right_panel: { laser_panel: tLaserPanel },
    },
    material_test_generator: tMaterial,
  } = useI18n();
  const lengthUnit = isInch ? 'in/s' : 'mm/s';
  const workarea = useWorkarea();
  const presetList = usePresetList(workarea, getDefaultModule());
  const maxSpeed = useMemo(() => getWorkarea(workarea).maxSpeed, [workarea]);
  const dropdownOptions = useMemo(
    () => presetList.map(({ key, name }) => ({ label: name, value: key || name })),
    [presetList],
  );

  const handleSelectChange = (value: string) => {
    const targetPreset = presetList.find(({ key }) => key === value);

    handleChange({
      power: targetPreset?.power || 15,
      select: { label: targetPreset?.name || value, value },
      speed: targetPreset?.speed || 20,
    });
  };

  const handleValueChange = (key: Param, value: number) => {
    const { max, min } = key === 'power' ? { max: 100, min: 1 } : { max: maxSpeed, min: 1 };

    handleChange({
      ...setting,
      [key]: Math.min(max, Math.max(min, value)),
      select: { label: 'Custom', value: 'custom' },
    });
  };

  return (
    <Flex className={className} gap="8px" justify="space-between" vertical>
      <Flex gap="20px" justify="space-between">
        <div className={styles.title}>{tMaterial.text_settings}</div>
        <div className={styles['sub-title']} style={{ width: '120px' }}>
          {tLaserPanel.strength}
        </div>
        <div className={styles['sub-title']} style={{ width: '120px' }}>
          {tLaserPanel.speed}
        </div>
      </Flex>

      <Flex gap="20px" justify="space-between">
        <Select
          onChange={handleSelectChange}
          options={dropdownOptions}
          style={{ width: '160px' }}
          value={setting.select.value}
        />
        <UnitInput
          addonAfter="%"
          className={styles.input}
          data-testid="text-power"
          key="text-power"
          max={100}
          min={1}
          onChange={(value) => handleValueChange('power', value!)}
          value={setting.power}
        />
        <UnitInput
          addonAfter={lengthUnit}
          className={styles.input}
          data-testid="text-speed"
          key="text-speed"
          max={maxSpeed}
          min={1}
          onChange={(value) => handleValueChange('speed', value!)}
          precision={isInch ? 4 : 0}
          step={isInch ? 25.4 : 1}
          value={setting.speed}
        />
      </Flex>
    </Flex>
  );
}
