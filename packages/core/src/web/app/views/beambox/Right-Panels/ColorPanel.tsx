import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, InputNumber, Slider, TooltipProps } from 'antd';

import ColorBlock from 'app/components/beambox/right-panel/ColorBlock';
import ColorPicker from 'app/widgets/ColorPicker';
import ColorPickerMobile from 'app/widgets/ColorPickerMobile';
import constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FloatingPanel from 'app/widgets/FloatingPanel';
import HistoryCommandFactory from 'app/svgedit/history/HistoryCommandFactory';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionPanelIcons from 'app/icons/option-panel/OptionPanelIcons';
import storage from 'implementations/storage';
import useDidUpdateEffect from 'helpers/hooks/useDidUpdateEffect';
import useI18n from 'helpers/useI18n';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { useIsMobile } from 'helpers/system-helper';

import styles from './ColorPanel.module.scss';

const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const EditStep = {
  Closed: 0,
  Color: 1,
  Previewing: 2,
};

const EditType = {
  None: 0,
  Fill: 1,
  Stroke: 2,
};

const deriveElementState = (element: Element) => {
  const fill = element.getAttribute('fill') || '#000000';
  const stroke = element.getAttribute('stroke') || 'none';
  const strokeWidthAttr = element.getAttribute('stroke-width') || '1';
  const strokeWidth = Number.isNaN(Number(strokeWidthAttr)) ? 1 : Number(strokeWidthAttr);
  return { fill, stroke, strokeWidth };
};

interface Props {
  elem: Element;
}

interface State {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

const ColorPanel = ({ elem }: Props): JSX.Element => {
  const isMobile = useIsMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.object_panel.option_panel;
  const [state, setState] = useState<State>(deriveElementState(elem));
  const [previewState, setPreviewState] = useState({
    currentStep: EditStep.Closed,
    type: EditType.None,
  });
  const previewRef = useRef({ origColor: '', newColor: '' });
  const { isColorPreviewing, setIsColorPreviewing } = useContext(CanvasContext);
  const { fill, stroke, strokeWidth } = state;
  useDidUpdateEffect(() => {
    setState(deriveElementState(elem));
  }, [elem]);

  const handleFillColorChange = (newColor: string, actual = true) => {
    if (actual && previewRef.current.origColor !== previewRef.current.newColor) {
      handleFillColorChange(previewRef.current.origColor, false);
    }
    const batchCmd = HistoryCommandFactory.createBatchCommand('Color Panel Fill');
    svgCanvas.undoMgr.beginUndoableChange('fill', [elem]);
    svgCanvas.changeSelectedAttributeNoUndo('fill', newColor, [elem]);
    let cmd = svgCanvas.undoMgr.finishUndoableChange();
    if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    svgCanvas.undoMgr.beginUndoableChange('fill-opacity', [elem]);
    svgCanvas.changeSelectedAttributeNoUndo('fill-opacity', newColor === 'none' ? '0' : '1', [
      elem,
    ]);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
    if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    if (actual) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
      previewRef.current.origColor = newColor;
    }
    previewRef.current.newColor = newColor;
    setState({ ...state, fill: newColor });
  };

  const handleStrokeColorChange = (newColor: string, actual = true) => {
    if (actual && previewRef.current.origColor !== previewRef.current.newColor) {
      handleStrokeColorChange(previewRef.current.origColor, false);
    }
    svgCanvas.undoMgr.beginUndoableChange('stroke', [elem]);
    svgCanvas.changeSelectedAttributeNoUndo('stroke', newColor, [elem]);
    const cmd = svgCanvas.undoMgr.finishUndoableChange();
    if (actual) {
      if (!cmd.isEmpty()) svgCanvas.undoMgr.addCommandToHistory(cmd);
      previewRef.current.origColor = newColor;
    }
    previewRef.current.newColor = newColor;
    setState({ ...state, stroke: newColor });
  };

  const handleStrokeWidthChange = (val: number) => {
    svgCanvas.changeSelectedAttribute('stroke-width', val, [elem]);
    setState({ ...state, strokeWidth: val });
  };

  const { ratio, decimal, step, max, unit } = useMemo(
    () =>
      storage.get('default-units') === 'inches'
        ? {
            ratio: constant.dpmm * 25.4,
            decimal: 2,
            step: constant.dpmm * 0.254,
            max: 127,
            unit: 'inch',
          }
        : { ratio: constant.dpmm, decimal: 1, step: constant.dpmm * 0.1, max: 100, unit: 'mm' },
    []
  );

  const startPreviewMode = (type: number, color: string) => {
    setIsColorPreviewing(true);
    svgCanvas.unsafeAccess.setCurrentMode('preview_color');
    svgCanvas.selectorManager.requestSelector(elem).resize();
    workareaEvents.emit('update-context-menu', { menuDisabled: true });
    setPreviewState({ currentStep: EditStep.Previewing, type });
    previewRef.current = { origColor: color, newColor: color };
  };

  const endPreviewMode = (newStatus = EditStep.Closed) => {
    const { currentStep, type } = previewState;
    const { origColor, newColor } = previewRef.current;
    if (currentStep === EditStep.Previewing) {
      if (origColor !== newColor) {
        if (type === EditType.Fill) handleFillColorChange(origColor, false);
        else handleStrokeColorChange(origColor, false);
      }
      setIsColorPreviewing(false);
      svgCanvas.unsafeAccess.setCurrentMode('select');
      svgCanvas.selectorManager.requestSelector(elem).resize();
      workareaEvents.emit('update-context-menu', { menuDisabled: false });
    }
    setPreviewState({ currentStep: newStatus, type });
  };

  useEffect(() => {
    if (!isColorPreviewing && previewState.currentStep === EditStep.Previewing) {
      endPreviewMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isColorPreviewing]);

  const renderBackIcon = () => {
    if (previewState.currentStep !== EditStep.Previewing) return null;
    return (
      <div className={styles.back} onClick={() => endPreviewMode(EditStep.Color)}>
        <OptionPanelIcons.Left />
      </div>
    );
  };

  return isMobile ? (
    <>
      <ObjectPanelItem.Item
        id="fill"
        content={<ColorBlock size="small" color={fill} />}
        label={t.fill}
        onClick={() => {
          setPreviewState({ currentStep: EditStep.Color, type: EditType.Fill });
          previewRef.current = { origColor: '', newColor: '' };
        }}
      />
      {previewState.type === EditType.Fill && (
        <FloatingPanel
          anchors={previewState.currentStep === EditStep.Color ? [0, 180] : [0, 320]}
          title={t.fill}
          forceClose={previewState.currentStep === EditStep.Closed}
          onClose={endPreviewMode}
          fixedContent={renderBackIcon()}
        >
          <div className={styles.panel}>
            <ColorBlock
              size="large"
              color={fill}
              onClick={() => startPreviewMode(EditType.Fill, fill)}
            />
            <ColorPickerMobile
              color={fill}
              onChange={handleFillColorChange}
              open={previewState.currentStep === EditStep.Previewing}
              onClose={() => endPreviewMode(EditStep.Color)}
            />
          </div>
        </FloatingPanel>
      )}
      <ObjectPanelItem.Item
        id="stroke"
        content={<OptionPanelIcons.Stroke />}
        label={t.stroke}
        onClick={() => {
          setPreviewState({
            currentStep: EditStep.Color,
            type: EditType.Stroke,
          });
          previewRef.current = { origColor: '', newColor: '' };
        }}
      />
      {previewState.type === EditType.Stroke && (
        <FloatingPanel
          anchors={previewState.currentStep === EditStep.Color ? [0, 270] : [0, 320]}
          title={previewState.currentStep === EditStep.Color ? t.stroke : t.stroke_color}
          forceClose={previewState.currentStep === EditStep.Closed}
          onClose={endPreviewMode}
          fixedContent={renderBackIcon()}
        >
          <div className={styles.panel}>
            <div className={styles.label}>{t.stroke_color}</div>
            <ColorBlock
              size="large"
              color={strokeWidth === 0 ? 'none' : stroke}
              onClick={() => startPreviewMode(EditType.Stroke, strokeWidth === 0 ? 'none' : stroke)}
            />
            <ColorPickerMobile
              color={strokeWidth === 0 ? 'none' : stroke}
              onChange={handleStrokeColorChange}
              open={previewState.currentStep === EditStep.Previewing}
              onClose={() => endPreviewMode(EditStep.Color)}
            />
            <div className={styles.field}>
              <div>
                <span className={styles.label}>{t.stroke_width}</span>
                <ConfigProvider theme={{ token: { borderRadius: 100 } }}>
                  <InputNumber
                    value={strokeWidth}
                    min={0}
                    step={step}
                    suffix={<span className={styles.suffix}>{unit}</span>}
                    onChange={handleStrokeWidthChange}
                    precision={decimal}
                    formatter={(v, { userTyping, input }) =>
                      userTyping ? input : (v / ratio).toFixed(decimal)
                    }
                    parser={(value) => Number(value) * ratio}
                    controls={false}
                  />
                </ConfigProvider>
              </div>
              <Slider
                min={0}
                max={max}
                step={step}
                value={strokeWidth}
                onChange={handleStrokeWidthChange}
                tooltip={
                  {
                    formatter: (val: number) => (val / ratio).toFixed(decimal),
                    placement:
                      // eslint-disable-next-line no-nested-ternary
                      strokeWidth < max * 0.1
                        ? 'topRight'
                        : strokeWidth > max * 0.9
                        ? 'topLeft'
                        : 'top',
                    arrow: { pointAtCenter: true },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } as TooltipProps as any
                }
              />
            </div>
          </div>
        </FloatingPanel>
      )}
      <ObjectPanelItem.Divider />
    </>
  ) : (
    <>
      <div className={styles.block}>
        <div className={styles.label}>{t.fill}</div>
        <ColorPicker allowClear initColor={fill} onChange={handleFillColorChange} />
      </div>
      <div className={styles.block}>
        <div className={styles.label}>{t.stroke}</div>
        <div className={styles.controls}>
          <ColorPicker
            initColor={strokeWidth === 0 ? 'none' : stroke}
            triggerType="stroke"
            onChange={handleStrokeColorChange}
          />
          <ConfigProvider
            theme={{
              components: {
                InputNumber: {
                  controlWidth: 60,
                },
              },
            }}
          >
            <InputNumber
              id="stroke-width"
              value={strokeWidth}
              size="small"
              min={0}
              step={step}
              onChange={handleStrokeWidthChange}
              precision={decimal}
              // addonAfter={isInch ? 'in' : 'mm'}
              formatter={(v, { userTyping, input }) =>
                userTyping ? input : (v / ratio).toFixed(decimal)
              }
              parser={(value) => Number(value) * ratio}
            />
          </ConfigProvider>
        </div>
      </div>
    </>
  );
};

export default ColorPanel;
