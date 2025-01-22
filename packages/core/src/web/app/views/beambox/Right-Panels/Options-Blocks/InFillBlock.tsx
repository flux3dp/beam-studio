import React, { useState } from 'react';

import { Button, ConfigProvider, Switch } from 'antd';
import classNames from 'classnames';

import { iconButtonTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './InFillBlock.module.scss';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  elem: Element;
  id?: string;
  label?: string;
}

const InFillBlock = ({ elem, id = 'infill', label }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const calculateFillInfo = (element: Element) => {
    const isFillable = svgCanvas.isElemFillable(element);
    const { isAllFilled, isAnyFilled } = svgCanvas.calcElemFilledInfo(element);

    return {
      isAllFilled,
      isAnyFilled,
      isFillable,
    };
  };
  const [fillInfo, setFillInfo] = useState(calculateFillInfo(elem));
  const { isAllFilled, isAnyFilled, isFillable } = fillInfo;

  useDidUpdateEffect(() => {
    setFillInfo(calculateFillInfo(elem));
  }, [elem]);

  if (!isFillable) {
    return null;
  }

  const onClick = () => {
    if (isAnyFilled) {
      svgCanvas.setElemsUnfill([elem]);
    } else {
      svgCanvas.setElemsFill([elem]);
    }

    setFillInfo((prev) => ({
      ...prev,
      isAllFilled: !isAnyFilled,
      isAnyFilled: !isAnyFilled,
    }));
    LayerPanelController.checkVector();
  };

  const isPartiallyFilled = elem.tagName === 'g' && isAnyFilled && !isAllFilled;

  return isMobile ? (
    <ObjectPanelItem.Item
      content={<Switch checked={isAnyFilled} />}
      id={id}
      label={label || lang.fill}
      onClick={onClick}
    />
  ) : label ? (
    <div className={styles['option-block']} key="infill">
      <div className={styles.label}>{label}</div>
      <Switch checked={isAnyFilled} onClick={onClick} size="small" />
    </div>
  ) : (
    <ConfigProvider theme={iconButtonTheme}>
      <Button
        className={classNames({ [styles.filled]: isAllFilled })}
        icon={isPartiallyFilled ? <OptionPanelIcons.InfillPartial /> : <OptionPanelIcons.Infill />}
        id={id}
        onClick={onClick}
        title={lang.fill}
        type="text"
      />
    </ConfigProvider>
  );
};

export default InFillBlock;
