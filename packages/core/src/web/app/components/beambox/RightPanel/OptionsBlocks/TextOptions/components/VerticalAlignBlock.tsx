import React from 'react';

import classNames from 'classnames';

import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import styles from '@core/app/components/beambox/RightPanel/OptionsPanel.module.scss';
import Select from '@core/app/widgets/AntdSelect';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

interface Props {
  hasMultiValue?: boolean;
  onValueChange: (val: VerticalAlign) => void;
  value: VerticalAlign;
}

export default function VerticalAlignBlock({ hasMultiValue, onValueChange, value }: Props): React.JSX.Element {
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
        onChange={onValueChange}
        options={options}
        selected={
          hasMultiValue
            ? { label: '-', value: undefined as unknown as VerticalAlign }
            : options.find((option) => option.value === value)
        }
      />
    );
  }

  return (
    <div className={classNames(styles['option-block'], styles['with-select'])}>
      <div className={styles.label}>{label}</div>
      <Select
        onChange={(val) => onValueChange(val)}
        onKeyDown={(e) => e.stopPropagation()}
        options={options}
        popupMatchSelectWidth={false}
        value={hasMultiValue ? '-' : value}
      />
    </div>
  );
}
