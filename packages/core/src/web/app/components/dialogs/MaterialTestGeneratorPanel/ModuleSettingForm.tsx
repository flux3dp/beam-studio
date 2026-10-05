import React from 'react';

import { Flex } from 'antd';
import { sprintf } from 'sprintf-js';

import Select from '@core/app/widgets/AntdSelect';
import type { GalvoModule } from '@core/helpers/device/galvoConfig';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Form.module.scss';

interface Props {
  className?: string;
  /** What the size limits fall back to while the field is unknown. */
  fallbackFieldSize: number;
  /** mm, or null while nobody has read it off a machine. */
  fieldSize: null | number;
  module: GalvoModule;
  modules: GalvoModule[];
  onModuleChange: (module: GalvoModule) => void;
}

/**
 * Which head the comparison is engraved with, and the field that head is fitted with.
 *
 * The field is shown rather than edited: it lives on the machine, and it is here because it decides
 * how large a block may be before the exporter has to split it. An unconnected machine leaves it
 * unknown, and the limits then assume the smaller lens -- too small a block only wastes material,
 * too large a one quietly puts a seam through the comparison.
 */
export default function ModuleSettingForm({
  className,
  fallbackFieldSize,
  fieldSize,
  module,
  modules,
  onModuleChange,
}: Props): React.JSX.Element {
  const {
    beambox: {
      right_panel: { laser_panel: tLaserPanel },
    },
    material_test_generator: tMaterial,
  } = useI18n();
  const translations = getModulesTranslations();

  return (
    <Flex className={className} justify="space-between">
      <Flex gap="8px" justify="space-between" vertical>
        <div className={styles.title}>{tMaterial.module_settings}</div>
        <div className={styles.label}>{tLaserPanel.module}</div>
        <div className={styles.label}>{tMaterial.field_size}</div>
      </Flex>

      <Flex align="flex-end" className={styles.inputs} gap="8px" justify="flex-end" vertical>
        {/* the title's own row: the sibling forms put a sub-title here, this one has nothing to say */}
        <div className={styles['sub-title']} />
        <Select
          className={styles.input}
          disabled={modules.length < 2}
          onChange={onModuleChange}
          options={modules.map((value) => ({ label: translations[value], value }))}
          value={module}
        />
        <div className={styles['read-only']} data-testid="field-size">
          {fieldSize === null ? sprintf(tMaterial.field_size_unknown, fallbackFieldSize) : `${fieldSize} mm`}
        </div>
      </Flex>
    </Flex>
  );
}
