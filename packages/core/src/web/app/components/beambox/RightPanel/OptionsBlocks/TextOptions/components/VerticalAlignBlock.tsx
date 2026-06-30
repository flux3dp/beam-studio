import React from 'react';

import classNames from 'classnames';

import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import FlexButton from '@core/app/components/beambox/RightPanel/common/FlexButton';
import Row from '@core/app/components/beambox/RightPanel/common/Row';
import styles from '@core/app/components/beambox/RightPanel/OptionsPanel.module.scss';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import Select from '@core/app/widgets/AntdSelect';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';

interface Props {
  hasMultiValue?: boolean;
  onValueChange: (val: VerticalAlign) => void;
  value: VerticalAlign;
}

export default function VerticalAlignBlock({ hasMultiValue, onValueChange, value }: Props): React.JSX.Element {
  const lang = useI18n().beambox.right_panel.object_panel;
  const label = lang.option_panel.vertical_align;
  const isTablet = useIsTabletOrMobile();
  const options = [
    { icon: <OptionPanelIcons.AlignBottom />, label: lang.bottom_align, value: VerticalAlign.BOTTOM },
    { icon: <OptionPanelIcons.AlignMiddle />, label: lang.middle_align, value: VerticalAlign.MIDDLE },
    { icon: <OptionPanelIcons.AlignTop />, label: lang.top_align, value: VerticalAlign.TOP },
  ];

  if (isTablet) {
    return (
      <ControlBlock label={label} type={ControlType.TEXTPATH_ALIGN}>
        <Row>
          {options.map((option) => (
            <FlexButton
              active={!hasMultiValue && option.value === value}
              icon={option.icon}
              key={option.value}
              onClick={() => onValueChange(option.value)}
              title={option.label}
            />
          ))}
        </Row>
      </ControlBlock>
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
