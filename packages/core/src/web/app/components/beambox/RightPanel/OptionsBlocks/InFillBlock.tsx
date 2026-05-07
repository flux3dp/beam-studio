import React, { useState } from 'react';

import { Switch } from 'antd';

import useLayerStore from '@core/app/stores/layer/layerStore';
import { useIsMobile } from '@core/app/stores/screenStore';
import Select from '@core/app/widgets/AntdSelect';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
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

  const setFilled = (filled: boolean) => {
    if (filled) {
      svgCanvas.setElemsFill(elems);
    } else {
      svgCanvas.setElemsUnfill(elems);
    }

    setFillInfo((prev) => ({
      ...prev,
      isAllFilled: filled,
      isAnyFilled: filled,
    }));
    useLayerStore.getState().checkVector();
  };

  const isPartiallyFilled = elems[0].tagName === 'g' && isAnyFilled && !isAllFilled;

  if (isMobile) {
    return (
      <ObjectPanelItem.Item
        content={<Switch checked={isAnyFilled} />}
        id={id}
        label={label || lang.fill}
        onClick={() => setFilled(!isAnyFilled)}
      />
    );
  }

  const fillOptions = [
    { label: 'Fill Engraving Mode', value: 'fill' },
    { label: 'Stroke Mode', value: 'stroke' },
  ];
  const value = isPartiallyFilled ? undefined : isAnyFilled ? 'fill' : 'stroke';
  const handleChange = (next: string) => setFilled(next === 'fill');

  return (
    <div className={styles['option-block']} key="infill">
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

export default InFillBlock;
