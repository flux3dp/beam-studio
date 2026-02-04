import React, { useContext, useEffect, useState } from 'react';

import { CanvasContext } from '@core/app/contexts/CanvasContext';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import ColorPicker from '@core/app/widgets/ColorPicker';
import ColorPickerMobile from '@core/app/widgets/ColorPickerMobile';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import HorizontalScrollContainer from '@core/app/widgets/HorizontalScrollContainer';
import colloectColors from '@core/helpers/color/collectColors';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ColorBlock from '../ColorBlock';
import ObjectPanelItem from '../ObjectPanelItem';

import styles from './MultiColorOptions.module.scss';

const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  elem: Element;
}

const EditStep = {
  Closed: 0,
  Color: 1,
  Previewing: 2,
};

const MultiColorOptions = ({ elem }: Props): React.JSX.Element => {
  const isMobile = useIsMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.object_panel.option_panel;
  const [colors, setColors] = useState(colloectColors(elem));

  useEffect(() => {
    setColors(colloectColors(elem));
  }, [elem]);

  const [previewState, setPreviewState] = useState({
    currentStep: EditStep.Closed,
    newColor: '',
    origColor: '',
  });
  const { isColorPreviewing, setIsColorPreviewing } = useContext(CanvasContext);

  const handleColorChange = (origColor: string, newColor: string, actual = true, rerender = true) => {
    const fillElements = [];
    const strokeElements = [];
    const useElems = new Set<SVGUseElement>();

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

    if (actual && previewState.origColor !== previewState.newColor) {
      handleColorChange(previewState.origColor, previewState.origColor, false, false);
    }

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

      setColors(colloectColors(elem));
      previewState.origColor = newColor;
    }

    previewState.newColor = newColor;
    setPreviewState({ ...previewState });
  };

  const startPreviewMode = (color: string) => {
    setIsColorPreviewing(true);
    setMouseMode('preview_color');
    svgCanvas.selectorManager.requestSelector(elem).resize();
    workareaEvents.emit('update-context-menu', { menuDisabled: true });
    setPreviewState({ currentStep: EditStep.Previewing, newColor: color, origColor: color });
  };

  const endPreviewMode = (newStatus = EditStep.Closed) => {
    const { currentStep, newColor, origColor } = previewState;

    if (currentStep === EditStep.Previewing) {
      if (origColor !== newColor) {
        handleColorChange(origColor, origColor, false);
      }

      setIsColorPreviewing(false);
      setMouseMode('select');
      svgCanvas.selectorManager.requestSelector(elem).resize();
      workareaEvents.emit('update-context-menu', { menuDisabled: false });
    }

    setPreviewState((state) => ({ ...state, currentStep: newStatus }));
  };

  useEffect(() => {
    if (!isColorPreviewing && previewState.currentStep === EditStep.Previewing) {
      endPreviewMode();
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [isColorPreviewing]);

  if (Object.keys(colors).length === 0) {
    return null;
  }

  return isMobile ? (
    <>
      <ObjectPanelItem.Item
        content={<OptionPanelIcons.Color />}
        id="color"
        label={t.color}
        onClick={() => {
          setPreviewState({ currentStep: EditStep.Color, newColor: '', origColor: '' });
        }}
      />
      <FloatingPanel
        anchors={previewState.currentStep === EditStep.Color ? [0, 180] : [0, 320]}
        fixedContent={
          previewState.currentStep === EditStep.Previewing && (
            <div className={styles.back} onClick={() => endPreviewMode(EditStep.Color)}>
              <OptionPanelIcons.Left />
            </div>
          )
        }
        forceClose={previewState.currentStep === EditStep.Closed}
        onClose={endPreviewMode}
        title={t.color}
      >
        <div className={styles.colors}>
          {Object.keys(colors).map((color) => (
            <ColorBlock
              className={styles.color}
              color={color}
              key={color}
              onClick={() => startPreviewMode(color)}
              size="large"
            />
          ))}
          <ColorPickerMobile
            color={previewState.newColor}
            onChange={(newColor, actual) => {
              handleColorChange(previewState.origColor, newColor, actual);
            }}
            onClose={() => endPreviewMode(EditStep.Color)}
            open={previewState.currentStep === EditStep.Previewing}
          />
        </div>
      </FloatingPanel>
    </>
  ) : (
    <div className={styles.block}>
      <div className={styles.label}>{t.color}</div>
      <HorizontalScrollContainer className={styles.controls}>
        {Object.keys(colors).map((color) => (
          <ColorPicker initColor={color} key={color} onChange={(newColor) => handleColorChange(color, newColor)} />
        ))}
      </HorizontalScrollContainer>
    </div>
  );
};

export default MultiColorOptions;
