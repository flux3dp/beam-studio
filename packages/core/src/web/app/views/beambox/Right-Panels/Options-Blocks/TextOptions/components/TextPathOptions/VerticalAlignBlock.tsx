import React from 'react';

import classNames from 'classnames';
import { useShallow } from 'zustand/react/shallow';

import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import styles from '@core/app/views/beambox/Right-Panels/OptionsPanel.module.scss';
import Select from '@core/app/widgets/AntdSelect';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { useTextOptionsStore } from '../../stores/useTextOptionsStore';

export default function VerticalAlignBlock(): React.JSX.Element {
  const { configs, handleVerticalAlignChange } = useTextOptionsStore(
    useShallow((state) => ({
      configs: state.configs,
      handleVerticalAlignChange: state.handleVerticalAlignChange,
    })),
  );
  const { verticalAlign } = configs;
  const lang = useI18n().beambox.right_panel.object_panel;
  const label = lang.option_panel.vertical_align;
  const isMobile = useIsMobile();
  const options = [
    { label: lang.bottom_align, value: VerticalAlign.BOTTOM },
    { label: lang.middle_align, value: VerticalAlign.MIDDLE },
    { label: lang.top_align, value: VerticalAlign.TOP },
  ];

  if (isMobile) {
    return (
      <ObjectPanelItem.Select
        id="vertical_align"
        label={label}
        onChange={handleVerticalAlignChange || (() => {})}
        options={options}
        selected={
          verticalAlign.hasMultiValue
            ? { label: '-', value: undefined as unknown as VerticalAlign }
            : options.find((option) => option.value === verticalAlign.value)
        }
      />
    );
  }

  return (
    <div className={classNames(styles['option-block'], styles['with-select'])}>
      <div className={styles.label}>{label}</div>
      <Select
        onChange={(val) => handleVerticalAlignChange?.(val)}
        onKeyDown={(e) => e.stopPropagation()}
        options={options}
        popupMatchSelectWidth={false}
        value={verticalAlign.hasMultiValue ? '-' : verticalAlign.value}
      />
    </div>
  );
}
