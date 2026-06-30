import React, { memo, use, useMemo, useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import type { ButtonProps } from 'antd';
import classNames from 'classnames';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import { ObjectPanelContext } from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelContext';
import ListButtonGroup from '@core/app/components/common/ListButtonGroup';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { calcElemsFilledInfo, setElemsFill, setElemsUnfill } from '@core/app/svgedit/operations/infill';
import Select from '@core/app/widgets/AntdSelect';
import { ControlType } from '@core/helpers/element/editable/base';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import { mockT } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import styles from './InFillBlock.module.scss';

interface Props {
  type?: 'infill' | 'infillPath';
}

const InFillBlock = ({ type = 'infill' }: Props): React.ReactNode => {
  const { activeKey } = use(ObjectPanelContext);
  const {
    beambox: {
      right_panel: {
        object_panel: { option_panel: lang },
      },
    },
    topbar: { tag_names: tTag },
  } = useI18n();
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

  const mixedOption = { icon: <OptionPanelIcons.InfillPartial />, label: mockT('混合') };
  const fillOptions = [
    { icon: <OptionPanelIcons.Infill infill="blue" />, label: lang.fill_engraving_mode, value: 'fill' },
    { icon: <OptionPanelIcons.Infill />, label: lang.stroke_mode, value: 'stroke' },
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
            {label ?? mockT('雕刻模式')}
            <DownOutlined className={classNames(styles.downIcon, { [styles.active]: activeKey === id })} />
          </>
        }
        renderContent={() => <ListButtonGroup items={buttons} size="large" />}
        title={<ControlBlock type={controlType}>{label ?? mockT('雕刻模式')}</ControlBlock>}
      />
    );
  }

  return (
    <div className={classNames(styles['option-block'], { [styles['no-label']]: !label })} key="infill">
      {label ? <div className={styles.label}>{label}</div> : null}
      <Select
        className={styles.select}
        id={id}
        onChange={handleChange}
        options={fillOptions}
        placeholder={lang.fill}
        value={value}
      />
    </div>
  );
};

export default memo(InFillBlock);
