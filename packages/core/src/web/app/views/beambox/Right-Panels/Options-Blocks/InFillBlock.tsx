import React, { useState } from 'react';
import classNames from 'classnames';
import { Button, ConfigProvider, Switch } from 'antd';

import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionPanelIcons from 'app/icons/option-panel/OptionPanelIcons';
import { iconButtonTheme } from 'app/constants/antd-config';
import useDidUpdateEffect from 'helpers/hooks/useDidUpdateEffect';
import useI18n from 'helpers/useI18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { useIsMobile } from 'helpers/system-helper';

import styles from './InFillBlock.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  label?: string;
  elem: Element;
  id?: string;
}

const InFillBlock = ({ elem, label, id = 'infill' }: Props): JSX.Element => {
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const calculateFillInfo = (element: Element) => {
    const isFillable = svgCanvas.isElemFillable(element);
    const { isAnyFilled, isAllFilled } = svgCanvas.calcElemFilledInfo(element);
    return {
      isFillable,
      isAnyFilled,
      isAllFilled,
    };
  };
  const [fillInfo, setFillInfo] = useState(calculateFillInfo(elem));
  const { isAnyFilled, isAllFilled, isFillable } = fillInfo;

  useDidUpdateEffect(() => {
    setFillInfo(calculateFillInfo(elem));
  }, [elem]);

  if (!isFillable) return null;
  const onClick = () => {
    if (isAnyFilled) {
      svgCanvas.setElemsUnfill([elem]);
    } else {
      svgCanvas.setElemsFill([elem]);
    }
    setFillInfo((prev) => ({
      ...prev,
      isAnyFilled: !isAnyFilled,
      isAllFilled: !isAnyFilled,
    }));
    LayerPanelController.checkVector();
  };

  const isPartiallyFilled = elem.tagName === 'g' && isAnyFilled && !isAllFilled;
  // eslint-disable-next-line no-nested-ternary
  return isMobile ? (
    <ObjectPanelItem.Item
      id={id}
      content={<Switch checked={isAnyFilled} />}
      label={label || lang.fill}
      onClick={onClick}
    />
  ) : label ? (
    <div className={styles['option-block']} key="infill">
      <div className={styles.label}>{label}</div>
      <Switch size="small" checked={isAnyFilled} onClick={onClick} />
    </div>
  ) : (
    <ConfigProvider theme={iconButtonTheme}>
      <Button
        id={id}
        type="text"
        className={classNames({ [styles.filled]: isAllFilled })}
        title={lang.fill}
        icon={isPartiallyFilled ? <OptionPanelIcons.InfillPartial /> : <OptionPanelIcons.Infill />}
        onClick={onClick}
      />
    </ConfigProvider>
  );
};

export default InFillBlock;
