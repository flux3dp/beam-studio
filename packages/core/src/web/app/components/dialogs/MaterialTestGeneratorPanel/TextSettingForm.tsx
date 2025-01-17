import React from 'react';

import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { Flex } from 'antd';
import Select from 'app/widgets/AntdSelect';
import presetHelper from 'helpers/presets/preset-helper';
import useWorkarea from 'helpers/hooks/useWorkarea';
import layerModuleHelper from 'helpers/layer-module/layer-module-helper';
import { getWorkarea } from 'app/constants/workarea-constants';
import { textParams, TextSetting } from './TextSetting';
import styles from './Form.module.scss';

interface Props {
  isInch: boolean;
  setting: TextSetting;
  handleChange: (textSetting: TextSetting) => void;
  className?: string;
}

type Param = (typeof textParams)[number];

export default function TextSettingForm({
  isInch,
  setting,
  handleChange,
  className,
}: Props): JSX.Element {
  const {
    beambox: {
      right_panel: { laser_panel: tLaserPanel },
    },
    material_test_generator: tMaterial,
  } = useI18n();
  const lengthUnit = isInch ? 'in/s' : 'mm/s';
  const workarea = useWorkarea();
  const { presetList, maxSpeed, dropdownOptions } = React.useMemo(() => {
    const list = presetHelper.getPresetsList(workarea, layerModuleHelper.getDefaultLaserModule());

    return {
      presetList: list,
      maxSpeed: getWorkarea(workarea).maxSpeed,
      dropdownOptions: list.map(({ key, name }) => ({ value: key || name, label: name })),
    };
  }, [workarea]);

  const handleSelectChange = (value: string) => {
    const targetPreset = presetList.find(({ key }) => key === value);

    handleChange({
      select: { value, label: targetPreset?.name || value },
      power: targetPreset?.power || 15,
      speed: targetPreset?.speed || 20,
    });
  };

  const handleValueChange = (key: Param, value: number) => {
    const { min, max } = key === 'power' ? { min: 1, max: 100 } : { min: 1, max: maxSpeed };

    handleChange({
      ...setting,
      select: { value: 'custom', label: 'Custom' },
      [key]: Math.min(max, Math.max(min, value)),
    });
  };

  return (
    <Flex vertical className={className} justify="space-between" gap="8px">
      <Flex justify="space-between" gap="20px">
        <div className={styles.title}>{tMaterial.text_settings}</div>
        <div style={{ width: '120px' }} className={styles['sub-title']}>
          {tLaserPanel.strength}
        </div>
        <div style={{ width: '120px' }} className={styles['sub-title']}>
          {tLaserPanel.speed}
        </div>
      </Flex>

      <Flex justify="space-between" gap="20px">
        <Select
          style={{ width: '160px' }}
          options={dropdownOptions}
          value={setting.select.value}
          onChange={handleSelectChange}
        />
        <UnitInput
          key="text-power"
          data-testid="text-power"
          className={styles.input}
          value={setting.power}
          max={100}
          min={1}
          addonAfter="%"
          onChange={(value) => handleValueChange('power', value)}
        />
        <UnitInput
          key="text-speed"
          data-testid="text-speed"
          className={styles.input}
          value={setting.speed}
          max={maxSpeed}
          min={1}
          precision={isInch ? 4 : 0}
          step={isInch ? 25.4 : 1}
          addonAfter={lengthUnit}
          onChange={(value) => handleValueChange('speed', value)}
        />
      </Flex>
    </Flex>
  );
}
