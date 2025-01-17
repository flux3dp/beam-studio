/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useMemo } from 'react';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { Flex } from 'antd';
import Select from 'app/widgets/AntdSelect';
import { LaserType } from 'app/constants/promark-constants';
import { WorkAreaModel } from 'app/constants/workarea-constants';
import { promarkModels } from 'app/actions/beambox/constant';
import { Detail, tableParams, TableSetting } from './TableSetting';
import styles from './Form.module.scss';

interface Props {
  isInch: boolean;
  tableSetting: TableSetting;
  workarea?: WorkAreaModel;
  laserType?: LaserType;
  blockOption?: 'cut' | 'engrave';
  handleChange: (tableSetting: TableSetting) => void;
  className?: string;
}

type TableParams = (typeof tableParams)[number];

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export default function TableSettingForm({
  isInch,
  tableSetting,
  workarea,
  laserType,
  blockOption,
  handleChange,
  className,
}: Props): JSX.Element {
  const {
    beambox: {
      right_panel: { laser_panel: tLaserPanel },
    },
    material_test_generator: tMaterial,
  } = useI18n();
  const lengthUnit = isInch ? 'in' : 'mm';
  const { settingEntries, options } = useMemo(
    () => ({
      settingEntries: Object.entries(tableSetting) as Array<[TableParams, Detail]>,
      options: Object.keys(tableSetting)
        .filter((key) => blockOption === 'engrave' || key !== 'fillInterval')
        .map((value) => ({ value, label: tLaserPanel[camelToSnake(value)] })),
    }),
    [blockOption, tLaserPanel, tableSetting]
  );

  const handleOptionChange = () => {
    const availableOptions = new Set(options.map(({ value }) => value));
    const invalidEntries = settingEntries.filter(
      ([key, { selected }]) => !availableOptions.has(key) && selected !== 2
    );

    if (!invalidEntries.length) {
      return;
    }

    const modifiedTableSetting = structuredClone(tableSetting);

    // swap the selected value of invalid entries with the first available option
    invalidEntries.forEach(([key, { selected }]) => {
      modifiedTableSetting[key].selected = 2;

      const [replacedKey] = Object.entries(modifiedTableSetting).find(
        ([, { selected }]) => selected === 2
      ) as [TableParams, Detail];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleValueChange = (key: TableParams, prefix: 'min' | 'max', value: number) => {
    const { min, max } = tableSetting[key];
    const limitValue = (v: number) => {
      const rangedValue = Math[prefix](
        v,
        tableSetting[key][prefix === 'min' ? 'maxValue' : 'minValue']
      );

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
      <Flex vertical justify="space-between" gap="8px" key={`table-setting-${index}`}>
        <div className={styles['sub-title']}>{tMaterial[index ? 'rows' : 'columns']}</div>
        <Select
          className={styles.input}
          options={options}
          value={key}
          onChange={(value) => handleSelectChange(value, index)}
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
              key={`${prefix}-${key}`}
              data-testid={`${prefix}-${key}`}
              isInch={useInch}
              className={styles.input}
              value={detail[`${prefix}Value`]}
              max={detail.max}
              min={detail.min}
              precision={precision}
              step={step()}
              addonAfter={addonAfter()}
              onChange={(value) => handleValueChange(key, prefix as 'min' | 'max', value)}
            />
          );
        })}
      </Flex>
    );
  };

  return (
    <Flex className={className} justify="space-between">
      <Flex vertical justify="space-between" gap="8px">
        <div className={styles.title}>{tMaterial.table_settings}</div>
        <div className={styles.label}>{tMaterial.parameter}</div>
        <div className={styles.label}>{tMaterial.min}</div>
        <div className={styles.label}>{tMaterial.max}</div>
      </Flex>

      <Flex className={styles.inputs} justify="flex-end" gap="20px">
        {[0, 1].map(renderInputGroup)}
      </Flex>
    </Flex>
  );
}
