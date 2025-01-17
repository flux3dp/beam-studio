import classNames from 'classnames';
import React, { useMemo } from 'react';

import beamboxPreference from 'app/actions/beambox/beambox-preference';
import configOptions from 'app/constants/config-options';
import Select from 'app/widgets/AntdSelect';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { ConfigKey, ConfigKeyTypeMap, Preset } from 'interfaces/ILayerConfig';
import { baseConfig } from 'helpers/layer/layer-config-helper';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  preset: Preset;
  maxSpeed: number;
  minSpeed: number;
  isInch?: boolean;
  lengthUnit?: 'mm' | 'in';
  handleChange: <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T]) => void;
}

const PrintingInputs = ({
  preset,
  maxSpeed,
  minSpeed,
  isInch = false,
  lengthUnit = 'mm',
  handleChange,
}: Props): JSX.Element => {
  const simpleMode = useMemo(() => !beamboxPreference.read('print-advanced-mode'), []);
  const lang = useI18n();
  const { saturationOptions, printingSpeedOptions, multipassOptions } = useMemo(
    () => ({
      saturationOptions: configOptions.getSaturationOptions(lang),
      printingSpeedOptions: configOptions.getPrintingSpeedOptions(lang),
      multipassOptions: configOptions.multipassOptions,
    }),
    [lang]
  );
  const tLaserPanel = lang.beambox.right_panel.laser_panel;

  return (
    <div className={styles.inputs}>
      <div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.ink_saturation}</div>
          {simpleMode ? (
            <Select
              id="inkSelect"
              disabled={preset.isDefault}
              className={styles.select}
              onChange={(val) => handleChange('ink', val)}
              value={preset.ink ?? baseConfig.ink}
            >
              {saturationOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <UnitInput
              data-testid="ink"
              className={styles.input}
              disabled={preset.isDefault}
              value={preset.ink ?? baseConfig.ink}
              max={15}
              min={1}
              precision={0}
              onChange={(value) => handleChange('ink', value)}
            />
          )}
        </div>
        <div className={classNames(styles.field, styles.small)}>
          <div className={styles.label}>Cyan</div>
          <UnitInput
            data-testid="cRatio"
            className={styles.input}
            size="small"
            disabled={preset.isDefault}
            value={preset.cRatio ?? baseConfig.cRatio}
            max={200}
            min={0}
            precision={0}
            addonAfter="%"
            onChange={(value) => handleChange('cRatio', value)}
          />
        </div>
        <div className={classNames(styles.field, styles.small)}>
          <div className={styles.label}>Magenta</div>
          <UnitInput
            data-testid="mRatio"
            className={styles.input}
            size="small"
            disabled={preset.isDefault}
            value={preset.mRatio ?? baseConfig.mRatio}
            max={200}
            min={0}
            precision={0}
            addonAfter="%"
            onChange={(value) => handleChange('mRatio', value)}
          />
        </div>
        <div className={classNames(styles.field, styles.small)}>
          <div className={styles.label}>Yellow</div>
          <UnitInput
            data-testid="yRatio"
            className={styles.input}
            size="small"
            disabled={preset.isDefault}
            value={preset.yRatio ?? baseConfig.yRatio}
            max={200}
            min={0}
            precision={0}
            addonAfter="%"
            onChange={(value) => handleChange('yRatio', value)}
          />
        </div>
        <div className={classNames(styles.field, styles.small)}>
          <div className={styles.label}>Black</div>
          <UnitInput
            data-testid="kRatio"
            className={styles.input}
            size="small"
            disabled={preset.isDefault}
            value={preset.kRatio ?? baseConfig.kRatio}
            max={200}
            min={0}
            precision={0}
            addonAfter="%"
            onChange={(value) => handleChange('kRatio', value)}
          />
        </div>
      </div>
      <div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.halftone}</div>
          <Select
            id="halftoneSelect"
            disabled={preset.isDefault}
            className={styles.select}
            onChange={(val) => handleChange('halftone', val)}
            value={preset.halftone ?? baseConfig.halftone}
          >
            <Select.Option value={1}>FM</Select.Option>
            <Select.Option value={2}>AM</Select.Option>
          </Select>
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.speed}</div>
          {simpleMode ? (
            <Select
              id="speedSelect"
              disabled={preset.isDefault}
              className={styles.select}
              onChange={(val) => handleChange('speed', val)}
              value={preset.speed ?? baseConfig.speed}
            >
              {printingSpeedOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <UnitInput
              data-testid="speed"
              className={styles.input}
              disabled={preset.isDefault}
              value={preset.speed ?? baseConfig.speed}
              max={maxSpeed}
              min={minSpeed}
              precision={isInch ? 2 : 1}
              addonAfter={`${lengthUnit}/s`}
              isInch={isInch}
              onChange={(value) => handleChange('speed', value)}
            />
          )}
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.print_multipass}</div>
          {simpleMode ? (
            <Select
              id="multipassSelect"
              disabled={preset.isDefault}
              className={styles.select}
              onChange={(val) => handleChange('multipass', val)}
              value={preset.multipass ?? baseConfig.multipass}
            >
              {multipassOptions.map(({ value }) => (
                <Select.Option key={value} value={value}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <UnitInput
              data-testid="multipass"
              className={styles.input}
              disabled={preset.isDefault}
              value={preset.multipass ?? baseConfig.multipass}
              max={10}
              min={1}
              precision={0}
              addonAfter={tLaserPanel.times}
              onChange={(value) => handleChange('multipass', value)}
            />
          )}
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.repeat}</div>
          <UnitInput
            data-testid="repeat"
            className={styles.input}
            disabled={preset.isDefault}
            value={preset.repeat ?? baseConfig.repeat}
            max={100}
            min={0}
            precision={0}
            addonAfter={tLaserPanel.times}
            onChange={(value) => handleChange('repeat', value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PrintingInputs;
