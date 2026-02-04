import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { TooltipProps } from 'antd';
import { ConfigProvider, InputNumber, Slider } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import ColorBlock from '@core/app/components/beambox/RightPanel/ColorBlock';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import ColorPicker from '@core/app/widgets/ColorPicker';
import ColorPickerMobile from '@core/app/widgets/ColorPickerMobile';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './ColorPanel.module.scss';

const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const EditStep = {
  Closed: 0,
  Color: 1,
  Previewing: 2,
};

const EditType = {
  Fill: 1,
  None: 0,
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

const ColorPanel = ({ elem }: Props): React.JSX.Element => {
  const isMobile = useIsMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.object_panel.option_panel;
  const [state, setState] = useState<State>(deriveElementState(elem));
  const [previewState, setPreviewState] = useState({
    currentStep: EditStep.Closed,
    type: EditType.None,
  });
  const previewRef = useRef({ newColor: '', origColor: '' });
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

    if (!cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

    svgCanvas.undoMgr.beginUndoableChange('fill-opacity', [elem]);
    svgCanvas.changeSelectedAttributeNoUndo('fill-opacity', newColor === 'none' ? '0' : '1', [elem]);
    cmd = svgCanvas.undoMgr.finishUndoableChange();

    if (!cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

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
      if (!cmd.isEmpty()) {
        svgCanvas.undoMgr.addCommandToHistory(cmd);
      }

      previewRef.current.origColor = newColor;
    }

    previewRef.current.newColor = newColor;
    setState({ ...state, stroke: newColor });
  };

  const handleStrokeWidthChange = (val: number) => {
    svgCanvas.changeSelectedAttribute('stroke-width', val, [elem]);
    setState({ ...state, strokeWidth: val });
  };
  const isInch = useStorageStore((state) => state.isInch);

  const { decimal, max, ratio, step, unit } = useMemo(
    () =>
      isInch
        ? { decimal: 2, max: 127, ratio: constant.dpmm * 25.4, step: constant.dpmm * 0.254, unit: 'inch' }
        : { decimal: 1, max: 100, ratio: constant.dpmm, step: constant.dpmm * 0.1, unit: 'mm' },
    [isInch],
  );

  const startPreviewMode = (type: number, color: string) => {
    setIsColorPreviewing(true);
    setMouseMode('preview_color');
    svgCanvas.selectorManager.requestSelector(elem)?.resize();
    workareaEvents.emit('update-context-menu', { menuDisabled: true });
    setPreviewState({ currentStep: EditStep.Previewing, type });
    previewRef.current = { newColor: color, origColor: color };
  };

  const endPreviewMode = (newStatus = EditStep.Closed) => {
    const { currentStep, type } = previewState;
    const { newColor, origColor } = previewRef.current;

    if (currentStep === EditStep.Previewing) {
      if (origColor !== newColor) {
        if (type === EditType.Fill) {
          handleFillColorChange(origColor, false);
        } else {
          handleStrokeColorChange(origColor, false);
        }
      }

      setIsColorPreviewing(false);
      setMouseMode('select');
      svgCanvas.selectorManager.requestSelector(elem)?.resize();
      workareaEvents.emit('update-context-menu', { menuDisabled: false });
    }

    setPreviewState({ currentStep: newStatus, type });
  };

  useEffect(() => {
    if (!isColorPreviewing && previewState.currentStep === EditStep.Previewing) {
      endPreviewMode();
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [isColorPreviewing]);

  const renderBackIcon = () => {
    if (previewState.currentStep !== EditStep.Previewing) {
      return null;
    }

    return (
      <div className={styles.back} onClick={() => endPreviewMode(EditStep.Color)}>
        <OptionPanelIcons.Left />
      </div>
    );
  };

  return isMobile ? (
    <>
      <ObjectPanelItem.Item
        content={<ColorBlock color={fill} size="small" />}
        id="fill"
        label={t.fill}
        onClick={() => {
          setPreviewState({ currentStep: EditStep.Color, type: EditType.Fill });
          previewRef.current = { newColor: '', origColor: '' };
        }}
      />
      {previewState.type === EditType.Fill && (
        <FloatingPanel
          anchors={previewState.currentStep === EditStep.Color ? [0, 180] : [0, 320]}
          fixedContent={renderBackIcon()}
          forceClose={previewState.currentStep === EditStep.Closed}
          onClose={endPreviewMode}
          title={t.fill}
        >
          <div className={styles.panel}>
            <ColorBlock color={fill} onClick={() => startPreviewMode(EditType.Fill, fill)} size="large" />
            <ColorPickerMobile
              color={fill}
              onChange={handleFillColorChange}
              onClose={() => endPreviewMode(EditStep.Color)}
              open={previewState.currentStep === EditStep.Previewing}
            />
          </div>
        </FloatingPanel>
      )}
      <ObjectPanelItem.Item
        content={<OptionPanelIcons.Stroke />}
        id="stroke"
        label={t.stroke}
        onClick={() => {
          setPreviewState({
            currentStep: EditStep.Color,
            type: EditType.Stroke,
          });
          previewRef.current = { newColor: '', origColor: '' };
        }}
      />
      {previewState.type === EditType.Stroke && (
        <FloatingPanel
          anchors={previewState.currentStep === EditStep.Color ? [0, 270] : [0, 320]}
          fixedContent={renderBackIcon()}
          forceClose={previewState.currentStep === EditStep.Closed}
          onClose={endPreviewMode}
          title={previewState.currentStep === EditStep.Color ? t.stroke : t.stroke_color}
        >
          <div className={styles.panel}>
            <div className={styles.label}>{t.stroke_color}</div>
            <ColorBlock
              color={strokeWidth === 0 ? 'none' : stroke}
              onClick={() => startPreviewMode(EditType.Stroke, strokeWidth === 0 ? 'none' : stroke)}
              size="large"
            />
            <ColorPickerMobile
              color={strokeWidth === 0 ? 'none' : stroke}
              onChange={handleStrokeColorChange}
              onClose={() => endPreviewMode(EditStep.Color)}
              open={previewState.currentStep === EditStep.Previewing}
            />
            <div className={styles.field}>
              <div>
                <span className={styles.label}>{t.stroke_width}</span>
                <ConfigProvider theme={{ token: { borderRadius: 100 } }}>
                  <InputNumber
                    controls={false}
                    formatter={(v, { input, userTyping }) => (userTyping ? input : (v / ratio).toFixed(decimal))}
                    min={0}
                    onChange={handleStrokeWidthChange}
                    parser={(value) => Number(value) * ratio}
                    precision={decimal}
                    step={step}
                    suffix={<span className={styles.suffix}>{unit}</span>}
                    value={strokeWidth}
                  />
                </ConfigProvider>
              </div>
              <Slider
                max={max}
                min={0}
                onChange={handleStrokeWidthChange}
                step={step}
                tooltip={
                  {
                    arrow: { pointAtCenter: true },
                    formatter: (val: number) => (val / ratio).toFixed(decimal),
                    placement: strokeWidth < max * 0.1 ? 'topRight' : strokeWidth > max * 0.9 ? 'topLeft' : 'top',
                  } as TooltipProps as any
                }
                value={strokeWidth}
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
            onChange={handleStrokeColorChange}
            triggerType="stroke"
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
              // addonAfter={isInch ? 'in' : 'mm'}
              formatter={(v, { input, userTyping }) => (userTyping ? input : (v / ratio).toFixed(decimal))}
              id="stroke-width"
              min={0}
              onChange={handleStrokeWidthChange}
              parser={(value) => Number(value) * ratio}
              precision={decimal}
              size="small"
              step={step}
              value={strokeWidth}
            />
          </ConfigProvider>
        </div>
      </div>
    </>
  );
};

export default ColorPanel;
