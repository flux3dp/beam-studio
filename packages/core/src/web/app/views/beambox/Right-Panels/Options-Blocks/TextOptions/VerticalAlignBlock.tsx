import React from 'react';

import classNames from 'classnames';

import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import styles from '@core/app/views/beambox/Right-Panels/OptionsPanel.module.scss';
import Select from '@core/app/widgets/AntdSelect';
import i18n from '@core/helpers/i18n';
import { useIsMobile } from '@core/helpers/system-helper';

interface Props {
  onValueChange: (val: VerticalAlign) => void;
  value: VerticalAlign;
}

export default function VerticalAlignBlock({ onValueChange, value }: Props): React.JSX.Element {
  const LANG = i18n.lang.beambox.right_panel.object_panel;
  const label = LANG.option_panel.vertical_align;
  const isMobile = useIsMobile();
  const options = [
    { label: LANG.bottom_align, value: VerticalAlign.BOTTOM },
    { label: LANG.middle_align, value: VerticalAlign.MIDDLE },
    { label: LANG.top_align, value: VerticalAlign.TOP },
  ];

  if (isMobile) {
    return (
      <ObjectPanelItem.Select
        id="vertical_align"
        label={label}
        onChange={onValueChange}
        options={options}
        selected={options.find((option) => option.value === value)}
      />
    );
  }

  return (
    <div className={classNames(styles['option-block'], styles['with-select'])}>
      <div className={styles.label}>{label}</div>
      <Select
        dropdownMatchSelectWidth={false}
        onChange={(val) => onValueChange(val)}
        onKeyDown={(e) => e.stopPropagation()}
        options={options}
        value={value}
      />
    </div>
  );
}
