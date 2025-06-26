import React, { useMemo } from 'react';

import classNames from 'classnames';

import configOptions, { getSpeedOptions } from '@core/app/constants/config-options';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/UnitInput';
import { useBeamboxPreference } from '@core/helpers/hooks/useBeamboxPreference';
import { baseConfig } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, ConfigKeyTypeMap, Preset } from '@core/interfaces/ILayerConfig';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  handleChange: <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T] | null) => void;
  isInch?: boolean;
  lengthUnit?: 'in' | 'mm';
  maxSpeed: number;
  minSpeed: number;
  preset: Preset;
}

const PrintingInputs = ({
  handleChange,
  isInch = false,
  lengthUnit = 'mm',
  maxSpeed,
  minSpeed,
  preset,
}: Props): React.JSX.Element => {
  const simpleMode = !useBeamboxPreference('print-advanced-mode');
  const lang = useI18n();
  const { multipassOptions, saturationOptions, speedOptions } = useMemo(
    () => ({
      multipassOptions: configOptions.multipassOptions,
      saturationOptions: configOptions.getSaturationOptions(lang),
      speedOptions: getSpeedOptions(lang, preset.module),
    }),
    [lang, preset.module],
  );
  const is4c = useMemo(() => preset.module === LayerModule.PRINTER_4C, [preset.module]);
  const tLaserPanel = lang.beambox.right_panel.laser_panel;

  return (
    <div className={styles.inputs}>
      {!is4c && (
        <div>
          <div className={styles.field}>
            <div className={styles.label}>{tLaserPanel.ink_saturation}</div>
            {simpleMode ? (
              <Select
                className={styles.select}
                disabled={preset.isDefault}
                id="inkSelect"
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
                className={styles.input}
                data-testid="ink"
                disabled={preset.isDefault}
                max={15}
                min={1}
                onChange={(value) => handleChange('ink', value)}
                precision={0}
                value={preset.ink ?? baseConfig.ink}
              />
            )}
          </div>
          <div className={classNames(styles.field, styles.small)}>
            <div className={styles.label}>Cyan</div>
            <UnitInput
              addonAfter="%"
              className={styles.input}
              data-testid="cRatio"
              disabled={preset.isDefault}
              max={200}
              min={0}
              onChange={(value) => handleChange('cRatio', value)}
              precision={0}
              size="small"
              value={preset.cRatio ?? baseConfig.cRatio}
            />
          </div>
          <div className={classNames(styles.field, styles.small)}>
            <div className={styles.label}>Magenta</div>
            <UnitInput
              addonAfter="%"
              className={styles.input}
              data-testid="mRatio"
              disabled={preset.isDefault}
              max={200}
              min={0}
              onChange={(value) => handleChange('mRatio', value)}
              precision={0}
              size="small"
              value={preset.mRatio ?? baseConfig.mRatio}
            />
          </div>
          <div className={classNames(styles.field, styles.small)}>
            <div className={styles.label}>Yellow</div>
            <UnitInput
              addonAfter="%"
              className={styles.input}
              data-testid="yRatio"
              disabled={preset.isDefault}
              max={200}
              min={0}
              onChange={(value) => handleChange('yRatio', value)}
              precision={0}
              size="small"
              value={preset.yRatio ?? baseConfig.yRatio}
            />
          </div>
          <div className={classNames(styles.field, styles.small)}>
            <div className={styles.label}>Black</div>
            <UnitInput
              addonAfter="%"
              className={styles.input}
              data-testid="kRatio"
              disabled={preset.isDefault}
              max={200}
              min={0}
              onChange={(value) => handleChange('kRatio', value)}
              precision={0}
              size="small"
              value={preset.kRatio ?? baseConfig.kRatio}
            />
          </div>
        </div>
      )}
      <div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.halftone}</div>
          <Select
            className={styles.select}
            disabled={preset.isDefault}
            id="halftoneSelect"
            onChange={(val) => handleChange('halftone', val)}
            value={preset.halftone ?? baseConfig.halftone}
          >
            <Select.Option value={1}>FM</Select.Option>
            <Select.Option value={2}>AM</Select.Option>
          </Select>
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.speed}</div>
          {simpleMode && speedOptions ? (
            <Select
              className={styles.select}
              disabled={preset.isDefault}
              id="speedSelect"
              onChange={(val) => handleChange('speed', val)}
              value={preset.speed ?? baseConfig.speed}
            >
              {speedOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <UnitInput
              addonAfter={`${lengthUnit}/s`}
              className={styles.input}
              data-testid="speed"
              disabled={preset.isDefault}
              isInch={isInch}
              max={maxSpeed}
              min={minSpeed}
              onChange={(value) => handleChange('speed', value)}
              precision={isInch ? 2 : 1}
              value={preset.speed ?? baseConfig.speed}
            />
          )}
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.print_multipass}</div>
          {simpleMode ? (
            <Select
              className={styles.select}
              disabled={preset.isDefault}
              id="multipassSelect"
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
              addonAfter={tLaserPanel.times}
              className={styles.input}
              data-testid="multipass"
              disabled={preset.isDefault}
              max={10}
              min={1}
              onChange={(value) => handleChange('multipass', value)}
              precision={0}
              value={preset.multipass ?? baseConfig.multipass}
            />
          )}
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.repeat}</div>
          <UnitInput
            addonAfter={tLaserPanel.times}
            className={styles.input}
            data-testid="repeat"
            disabled={preset.isDefault}
            max={100}
            min={0}
            onChange={(value) => handleChange('repeat', value)}
            precision={0}
            value={preset.repeat ?? baseConfig.repeat}
          />
        </div>
      </div>
    </div>
  );
};

export default PrintingInputs;
