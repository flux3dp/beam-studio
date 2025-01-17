import classNames from 'classnames';
import React from 'react';

import i18n from 'helpers/i18n';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from 'app/widgets/AntdSelect';
import styles from 'app/views/beambox/Right-Panels/OptionsPanel.module.scss';
import { useIsMobile } from 'helpers/system-helper';
import { VerticalAlign } from 'app/actions/beambox/textPathEdit';

interface Props {
  value: VerticalAlign;
  onValueChange: (val: VerticalAlign) => void;
}

export default function VerticalAlignBlock({ value, onValueChange }: Props): JSX.Element {
  const LANG = i18n.lang.beambox.right_panel.object_panel;
  const label = LANG.option_panel.vertical_align;
  const isMobile = useIsMobile();
  const options = [
    { value: VerticalAlign.BOTTOM, label: LANG.bottom_align },
    { value: VerticalAlign.MIDDLE, label: LANG.middle_align },
    { value: VerticalAlign.TOP, label: LANG.top_align },
  ];
  if (isMobile) {
    return (
      <ObjectPanelItem.Select
        id="vertical_align"
        selected={options.find((option) => option.value === value)}
        options={options}
        onChange={onValueChange}
        label={label}
      />
    );
  }
  return (
    <div className={classNames(styles['option-block'], styles['with-select'])}>
      <div className={styles.label}>{label}</div>
      <Select
        value={value}
        options={options}
        onChange={(val) => onValueChange(val)}
        onKeyDown={(e) => e.stopPropagation()}
        dropdownMatchSelectWidth={false}
      />
    </div>
  );
}
