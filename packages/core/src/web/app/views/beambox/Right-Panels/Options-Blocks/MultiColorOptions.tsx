import React, { useContext, useEffect, useState } from 'react';

import ColorBlock from 'app/components/beambox/right-panel/ColorBlock';
import ColorPicker from 'app/widgets/ColorPicker';
import ColorPickerMobile from 'app/widgets/ColorPickerMobile';
import colloectColors from 'helpers/color/collectColors';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FloatingPanel from 'app/widgets/FloatingPanel';
import HistoryCommandFactory from 'app/svgedit/history/HistoryCommandFactory';
import HorizontalScrollContainer from 'app/widgets/HorizontalScrollContainer';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionPanelIcons from 'app/icons/option-panel/OptionPanelIcons';
import symbolMaker from 'helpers/symbol-maker';
import useI18n from 'helpers/useI18n';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { useIsMobile } from 'helpers/system-helper';

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

const MultiColorOptions = ({ elem }: Props): JSX.Element => {
  const isMobile = useIsMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.object_panel.option_panel;
  const [colors, setColors] = useState(colloectColors(elem));
  useEffect(() => {
    setColors(colloectColors(elem));
  }, [elem]);
  const [previewState, setPreviewState] = useState({
    currentStep: EditStep.Closed,
    origColor: '',
    newColor: '',
  });
  const { isColorPreviewing, setIsColorPreviewing } = useContext(CanvasContext);

  const handleColorChange = (
    origColor: string,
    newColor: string,
    actual = true,
    rerender = true
  ) => {
    const fillElements = [];
    const strokeElements = [];
    const useElems = new Set<SVGUseElement>();
    colors[origColor]?.forEach(({ element, attribute, useElement }) => {
      if (attribute === 'fill') fillElements.push(element);
      else if (attribute === 'stroke') strokeElements.push(element);
      if (useElement) useElems.add(useElement);
    });
    if (actual && previewState.origColor !== previewState.newColor) {
      handleColorChange(previewState.origColor, previewState.origColor, false, false);
    }
    const batchCmd = HistoryCommandFactory.createBatchCommand('Update Color');
    if (fillElements.length > 0) {
      svgCanvas.undoMgr.beginUndoableChange('fill', fillElements);
      svgCanvas.changeSelectedAttributeNoUndo('fill', newColor, fillElements);
      const cmd = svgCanvas.undoMgr.finishUndoableChange();
      if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    }
    if (strokeElements.length > 0) {
      svgCanvas.undoMgr.beginUndoableChange('stroke', strokeElements);
      svgCanvas.changeSelectedAttributeNoUndo('stroke', newColor, strokeElements);
      const cmd = svgCanvas.undoMgr.finishUndoableChange();
      if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    }
    if (useElems.size > 0) {
      const reRenderArray = Array.from(useElems);
      if (rerender) symbolMaker.reRenderImageSymbolArray(reRenderArray, { force: true });
      batchCmd.onAfter = () => {
        symbolMaker.reRenderImageSymbolArray(reRenderArray, { force: true });
      };
    }
    if (actual) {
      if (!batchCmd.isEmpty()) svgCanvas.undoMgr.addCommandToHistory(batchCmd);
      setColors(colloectColors(elem));
      previewState.origColor = newColor;
    }
    previewState.newColor = newColor;
    setPreviewState({ ...previewState });
  };

  const startPreviewMode = (color: string) => {
    setIsColorPreviewing(true);
    svgCanvas.unsafeAccess.setCurrentMode('preview_color');
    svgCanvas.selectorManager.requestSelector(elem).resize();
    workareaEvents.emit('update-context-menu', { menuDisabled: true });
    setPreviewState({ currentStep: EditStep.Previewing, origColor: color, newColor: color });
  };

  const endPreviewMode = (newStatus = EditStep.Closed) => {
    const { currentStep, origColor, newColor } = previewState;
    if (currentStep === EditStep.Previewing) {
      if (origColor !== newColor) handleColorChange(origColor, origColor, false);
      setIsColorPreviewing(false);
      svgCanvas.unsafeAccess.setCurrentMode('select');
      svgCanvas.selectorManager.requestSelector(elem).resize();
      workareaEvents.emit('update-context-menu', { menuDisabled: false });
    }
    setPreviewState((state) => ({ ...state, currentStep: newStatus }));
  };

  useEffect(() => {
    if (!isColorPreviewing && previewState.currentStep === EditStep.Previewing) {
      endPreviewMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isColorPreviewing]);

  if (Object.keys(colors).length === 0) return null;

  return isMobile ? (
    <>
      <ObjectPanelItem.Item
        id="color"
        content={<OptionPanelIcons.Color />}
        label={t.color}
        onClick={() => {
          setPreviewState({ currentStep: EditStep.Color, origColor: '', newColor: '' });
        }}
      />
      <FloatingPanel
        anchors={previewState.currentStep === EditStep.Color ? [0, 180] : [0, 320]}
        title={t.color}
        forceClose={previewState.currentStep === EditStep.Closed}
        onClose={endPreviewMode}
        fixedContent={
          previewState.currentStep === EditStep.Previewing && (
            <div className={styles.back} onClick={() => endPreviewMode(EditStep.Color)}>
              <OptionPanelIcons.Left />
            </div>
          )
        }
      >
        <div className={styles.colors}>
          {Object.keys(colors).map((color) => (
            <ColorBlock
              key={color}
              className={styles.color}
              size="large"
              color={color}
              onClick={() => startPreviewMode(color)}
            />
          ))}
          <ColorPickerMobile
            color={previewState.newColor}
            onChange={(newColor, actual) => {
              handleColorChange(previewState.origColor, newColor, actual);
            }}
            open={previewState.currentStep === EditStep.Previewing}
            onClose={() => endPreviewMode(EditStep.Color)}
          />
        </div>
      </FloatingPanel>
    </>
  ) : (
    <div className={styles.block}>
      <div className={styles.label}>{t.color}</div>
      <HorizontalScrollContainer className={styles.controls}>
        {Object.keys(colors).map((color) => (
          <ColorPicker
            key={color}
            initColor={color}
            onChange={(newColor) => handleColorChange(color, newColor)}
          />
        ))}
      </HorizontalScrollContainer>
    </div>
  );
};

export default MultiColorOptions;
