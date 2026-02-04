import React, { useState } from 'react';

import { Button, ConfigProvider, Switch } from 'antd';
import classNames from 'classnames';

import { iconButtonTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import useLayerStore from '@core/app/stores/layer/layerStore';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './InFillBlock.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  elems: Element[];
  id?: string;
  label?: string;
}

const InFillBlock = ({ elems, id = 'infill', label }: Props): React.ReactNode => {
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const calculateFillInfo = (elements: Element[]) => {
    let isFillable = elements.length > 0;
    let isAllFilled = true;
    let isAnyFilled = false;

    for (const element of elements) {
      isFillable = svgCanvas.isElemFillable(element);

      if (!isFillable) break;

      const { isAllFilled: subIsAllFilled, isAnyFilled: subIsAnyFilled } = svgCanvas.calcElemFilledInfo(element);

      isAllFilled = isAllFilled && subIsAllFilled;
      isAnyFilled = isAnyFilled || subIsAnyFilled;
    }

    return {
      isAllFilled,
      isAnyFilled,
      isFillable,
    };
  };
  const [fillInfo, setFillInfo] = useState(calculateFillInfo(elems));
  const { isAllFilled, isAnyFilled, isFillable } = fillInfo;

  useDidUpdateEffect(() => {
    setFillInfo(calculateFillInfo(elems));
  }, [elems]);

  if (!isFillable) {
    return null;
  }

  const onClick = () => {
    if (isAnyFilled) {
      svgCanvas.setElemsUnfill(elems);
    } else {
      svgCanvas.setElemsFill(elems);
    }

    setFillInfo((prev) => ({
      ...prev,
      isAllFilled: !isAnyFilled,
      isAnyFilled: !isAnyFilled,
    }));
    useLayerStore.getState().checkVector();
  };

  const isPartiallyFilled = elems[0].tagName === 'g' && isAnyFilled && !isAllFilled;

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
