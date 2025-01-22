import React, { useEffect, useMemo } from 'react';

import { Flex } from 'antd';

import { promarkModels } from '@core/app/actions/beambox/constant';
import type { LaserType } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './Form.module.scss';
import type { Detail, tableParams, TableSetting } from './TableSetting';

interface Props {
  blockOption?: 'cut' | 'engrave';
  className?: string;
  handleChange: (tableSetting: TableSetting) => void;
  isInch: boolean;
  laserType?: LaserType;
  tableSetting: TableSetting;
  workarea?: WorkAreaModel;
}

type TableParams = (typeof tableParams)[number];

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export default function TableSettingForm({
  blockOption,
  className,
  handleChange,
  isInch,
  laserType,
  tableSetting,
  workarea,
}: Props): React.JSX.Element {
  const {
    beambox: {
      right_panel: { laser_panel: tLaserPanel },
    },
    material_test_generator: tMaterial,
  } = useI18n();
  const lengthUnit = isInch ? 'in' : 'mm';
  const { options, settingEntries } = useMemo(
    () => ({
      options: Object.keys(tableSetting)
        .filter((key) => blockOption === 'engrave' || key !== 'fillInterval')
        .map((value) => ({ label: tLaserPanel[camelToSnake(value)], value })),
      settingEntries: Object.entries(tableSetting) as Array<[TableParams, Detail]>,
    }),
    [blockOption, tLaserPanel, tableSetting],
  );

  const handleOptionChange = () => {
    const availableOptions = new Set(options.map(({ value }) => value));
    const invalidEntries = settingEntries.filter(([key, { selected }]) => !availableOptions.has(key) && selected !== 2);

    if (!invalidEntries.length) {
      return;
    }

    const modifiedTableSetting = structuredClone(tableSetting);

    // swap the selected value of invalid entries with the first available option
    invalidEntries.forEach(([key, { selected }]) => {
      modifiedTableSetting[key].selected = 2;

      const [replacedKey] = Object.entries(modifiedTableSetting).find(([, { selected }]) => selected === 2) as [
        TableParams,
        Detail,
      ];

      modifiedTableSetting[replacedKey].selected = selected;
    });

    handleChange(modifiedTableSetting);
  };

  const handleBlockOptionChange = (value: 'cut' | 'engrave') => {
    // for promark models, when blockOption is 'cut', fillInterval should be set to default value
    if (promarkModels.has(workarea) || value === 'cut') {
      handleOptionChange();
    }
  };

  useEffect(() => {
    handleBlockOptionChange(blockOption);
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [blockOption, laserType, workarea]);

  const handleSelectChange = (value: string, index: number) => {
    const [currentKey] = settingEntries.find(([, { selected }]) => selected === index);

    if (!currentKey) {
      return;
    }

    handleChange({
      ...tableSetting,
      [currentKey]: { ...tableSetting[currentKey], selected: tableSetting[value].selected },
      [value]: { ...tableSetting[value], selected: index },
    });
  };

  const handleValueChange = (key: TableParams, prefix: 'max' | 'min', value: number) => {
    const { max, min } = tableSetting[key];
    const limitValue = (v: number) => {
      const rangedValue = Math[prefix](v, tableSetting[key][prefix === 'min' ? 'maxValue' : 'minValue']);

      return Math.min(max, Math.max(min, rangedValue));
    };

    handleChange({
      ...tableSetting,
      [key]: { ...tableSetting[key], [`${prefix}Value`]: limitValue(value) },
    });
  };

  const renderInputGroup = (index: number) => {
    const [key, detail] = settingEntries.find(([, { selected }]) => selected === index) || [];
    const useInch = isInch && key === 'speed';

    return (
      <Flex gap="8px" justify="space-between" key={`table-setting-${index}`} vertical>
        <div className={styles['sub-title']}>{tMaterial[index ? 'rows' : 'columns']}</div>
        <Select
          className={styles.input}
          onChange={(value) => handleSelectChange(value, index)}
          options={options}
          value={key}
        />
        {['min', 'max'].map((prefix) => {
          const addonAfter = () => {
            switch (key) {
              case 'strength':
                return '%';
              case 'speed':
                return `${lengthUnit}/s`;
              case 'fillInterval':
                return 'mm';
              default:
                return '';
            }
          };

          const precision = useInch || key === 'fillInterval' ? 4 : 0;
          const step = () => {
            if (key === 'fillInterval') {
              return 0.0001;
            }

            return useInch ? 25.4 : 1;
          };

          return (
            <UnitInput
              addonAfter={addonAfter()}
              className={styles.input}
              data-testid={`${prefix}-${key}`}
              isInch={useInch}
              key={`${prefix}-${key}`}
              max={detail.max}
              min={detail.min}
              onChange={(value) => handleValueChange(key, prefix as 'max' | 'min', value)}
              precision={precision}
              step={step()}
              value={detail[`${prefix}Value`]}
            />
          );
        })}
      </Flex>
    );
  };

  return (
    <Flex className={className} justify="space-between">
      <Flex gap="8px" justify="space-between" vertical>
        <div className={styles.title}>{tMaterial.table_settings}</div>
        <div className={styles.label}>{tMaterial.parameter}</div>
        <div className={styles.label}>{tMaterial.min}</div>
        <div className={styles.label}>{tMaterial.max}</div>
      </Flex>

      <Flex className={styles.inputs} gap="20px" justify="flex-end">
        {[0, 1].map(renderInputGroup)}
      </Flex>
    </Flex>
  );
}
