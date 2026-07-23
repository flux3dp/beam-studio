import React, { memo, useMemo, useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import type { ButtonProps } from 'antd';
import classNames from 'classnames';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import ListButtonGroup from '@core/app/components/common/ListButtonGroup';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { calcElemsFilledInfo, setElemsFill, setElemsUnfill } from '@core/app/svgedit/operations/infill';
import Select from '@core/app/widgets/AntdSelect';
import { ControlType } from '@core/helpers/element/editable/base';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import useI18n from '@core/helpers/useI18n';

import styles from './InFillBlock.module.scss';

interface Props {
  type?: 'infill' | 'infillPath';
}

const InFillBlock = ({ type = 'infill' }: Props): React.ReactNode => {
  const activeKey = useSelectedElementStore((state) => state.activeKey);
  const {
    beambox: {
      right_panel: { object_panel: tObjectPanel },
    },
    topbar: { tag_names: tTag },
  } = useI18n();
  const lang = tObjectPanel.option_panel;
  const isTablet = useIsTabletOrMobile();
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);
  const elems = useSelectedElementStore(
    (state) => state.objectPanelData![type === 'infill' ? 'infillElems' : 'pathElems'],
  );
  const isTextPath = useSelectedElementStore((state) => state.objectPanelData!.isTextPath);

  const [fillInfo, setFillInfo] = useState(() => calcElemsFilledInfo(elems));
  const { isAllFilled, isAnyFilled, isFillable } = fillInfo;
  const { controlType, id, label } = useMemo(
    () =>
      type === 'infillPath'
        ? { controlType: ControlType.PATH_INFILL, id: 'path_infill', label: tTag.path }
        : { controlType: ControlType.INFILL, id: 'infill', label: isTextPath ? tTag.text : undefined },

    [type, tTag, isTextPath],
  );

  useDidUpdateEffect(() => {
    setFillInfo(calcElemsFilledInfo(elems));
  }, [elems]);

  if (!isFillable || elems.length === 0) return null;

  const setFilled = (filled: boolean) => {
    if (filled) {
      setElemsFill(elems);
    } else {
      setElemsUnfill(elems);
    }

    setFillInfo((prev) => ({
      ...prev,
      isAllFilled: filled,
      isAnyFilled: filled,
    }));
    useLayerStore.getState().checkVector();
  };

  const isPartiallyFilled = elems[0].tagName === 'g' && isAnyFilled && !isAllFilled;

  const mixedOption = { icon: <OptionPanelIcons.InfillPartial />, label: lang.mixed_fill_mode };
  const fillOptions = [
    { icon: <OptionPanelIcons.Infill />, label: lang.fill_engraving_mode, value: 'fill' },
    { icon: <OptionPanelIcons.InfillNone />, label: lang.stroke_mode, value: 'stroke' },
  ];
  const value = isPartiallyFilled ? undefined : isAnyFilled ? 'fill' : 'stroke';
  const handleChange = (next: string) => setFilled(next === 'fill');

  if (isTablet) {
    const selectedIndex = fillOptions.findIndex((option) => option.value === value);
    const selectedOption = fillOptions[selectedIndex] ?? mixedOption;
    const buttons: ButtonProps[] = fillOptions.map((option, index) => {
      const isSelected = index === selectedIndex;

      return {
        children: option.label,
        className: styles.button,
        color: isSelected ? 'primary' : 'default',
        icon: option.icon,
        onClick: () => handleChange(option.value),
        variant: isSelected ? 'filled' : 'text',
      };
    });

    return isWithinTemplateModes ? (
      <ListButtonGroup items={buttons} size="large" />
    ) : (
      <ObjectPanelItem
        icon={selectedOption.icon}
        id={id}
        itemChildren={
          <>
            {label ?? tObjectPanel.sections.operation_mode}
            <DownOutlined className={classNames(styles.downIcon, { [styles.active]: activeKey === id })} />
          </>
        }
        renderContent={() => <ListButtonGroup items={buttons} size="large" />}
        title={<ControlBlock type={controlType}>{label ?? tObjectPanel.sections.operation_mode}</ControlBlock>}
      />
    );
  }

  return (
    <ControlBlock
      className={classNames(styles['option-block'], { [styles['no-label']]: !label })}
      key="infill"
      type={controlType}
    >
      {label ? <div className={styles.label}>{label}</div> : null}
      <Select
        className={styles.select}
        id={id}
        onChange={handleChange}
        options={fillOptions}
        placeholder={lang.fill}
        value={value}
      />
    </ControlBlock>
  );
};

export default memo(InFillBlock);
