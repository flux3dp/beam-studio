import React, { useCallback, useEffect, useState } from 'react';

import Content from '@core/app/components/beambox/RightPanel/common/Content';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import ColorPicker from '@core/app/widgets/ColorPicker';
import ColorPickerMobile from '@core/app/widgets/ColorPickerMobile';
import HorizontalScrollContainer from '@core/app/widgets/HorizontalScrollContainer';
import colloectColors from '@core/helpers/color/collectColors';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ColorBlock from '../ColorBlock';

import styles from './MultiColorOptions.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  elem: Element;
}

const MultiColorOptions = ({ elem }: Props): React.ReactNode => {
  const isTablet = useIsTabletOrMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.object_panel.option_panel;
  const [colors, setColors] = useState(colloectColors(elem));
  const allColors = Object.keys(colors);
  const [editingColor, setEditingColor] = useState(allColors[0]);

  useEffect(() => {
    const newColors = colloectColors(elem);

    setColors(newColors);
    setEditingColor(Object.keys(newColors)[0]);
  }, [elem]);

  const handleColorChange = useCallback(
    (origColor: string, newColor: string, actual = true, rerender = true) => {
      const fillElements: Element[] = [];
      const strokeElements: Element[] = [];
      const useElems = new Set<SVGUseElement>();

      newColor = newColor.toUpperCase();
      colors[origColor]?.forEach(({ attribute, element, useElement }) => {
        if (attribute === 'fill') {
          fillElements.push(element);
        } else if (attribute === 'stroke') {
          strokeElements.push(element);
        }

        if (useElement) {
          useElems.add(useElement);
        }
      });

      const batchCmd = HistoryCommandFactory.createBatchCommand('Update Color');

      if (fillElements.length > 0) {
        svgCanvas.undoMgr.beginUndoableChange('fill', fillElements);
        svgCanvas.changeSelectedAttributeNoUndo('fill', newColor, fillElements);

        const cmd = svgCanvas.undoMgr.finishUndoableChange();

        if (!cmd.isEmpty()) {
          batchCmd.addSubCommand(cmd);
        }
      }

      if (strokeElements.length > 0) {
        svgCanvas.undoMgr.beginUndoableChange('stroke', strokeElements);
        svgCanvas.changeSelectedAttributeNoUndo('stroke', newColor, strokeElements);

        const cmd = svgCanvas.undoMgr.finishUndoableChange();

        if (!cmd.isEmpty()) {
          batchCmd.addSubCommand(cmd);
        }
      }

      if (useElems.size > 0) {
        const reRenderArray = Array.from(useElems);

        if (rerender) {
          symbolMaker.reRenderImageSymbolArray(reRenderArray, { force: true });
        }

        batchCmd.onAfter = () => {
          symbolMaker.reRenderImageSymbolArray(reRenderArray, { force: true });
        };
      }

      if (actual) {
        if (!batchCmd.isEmpty()) {
          svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        }

        const newColors = colloectColors(elem);

        setColors(newColors);
        setEditingColor(newColors[newColor] ? newColor : Object.keys(newColors)[0]);
      }
    },
    [colors, elem],
  );

  const onChange = useCallback(
    (newColor: string, actual?: boolean) => {
      handleColorChange(editingColor, newColor, actual);
    },
    [editingColor, handleColorChange],
  );

  if (allColors.length === 0) {
    return null;
  }

  return isTablet ? (
    <ObjectPanelItem
      icon={<OptionPanelIcons.Color />}
      id="color"
      renderContent={() => (
        <Content>
          <div className={styles.colors}>
            {allColors.map((color) => (
              <ColorBlock
                active={color === editingColor}
                className={styles.color}
                color={color}
                key={color}
                onClick={() => setEditingColor(color)}
                size="large"
              />
            ))}
          </div>
          <ColorPickerMobile color={editingColor} onChange={onChange} />
        </Content>
      )}
      title={t.color}
    />
  ) : (
    <div className={styles.block}>
      <div className={styles.label}>{t.color}</div>
      <HorizontalScrollContainer className={styles.controls}>
        {allColors.map((color) => (
          <ColorPicker initColor={color} key={color} onChange={(newColor) => handleColorChange(color, newColor)} />
        ))}
      </HorizontalScrollContainer>
    </div>
  );
};

export default MultiColorOptions;
