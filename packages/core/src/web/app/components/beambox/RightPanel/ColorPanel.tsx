import React, { useCallback, useMemo, useState } from 'react';

import { ConfigProvider } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import Content from '@core/app/components/beambox/RightPanel/common/Content';
import Label from '@core/app/components/beambox/RightPanel/common/Label';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import Tabs from '@core/app/components/beambox/RightPanel/common/Tabs';
import ValueDisplay from '@core/app/components/beambox/RightPanel/common/ValueDisplay';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import ColorPicker from '@core/app/widgets/ColorPicker';
import ColorPickerMobile from '@core/app/widgets/ColorPickerMobile';
import UnitInput from '@core/app/widgets/UnitInput';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import styles from './ColorPanel.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const deriveElementState = (element: Element) => {
  const fill = element.getAttribute('fill') || '#000000';
  const stroke = element.getAttribute('stroke') || 'none';
  const strokeWidthAttr = element.getAttribute('stroke-width') || '1';
  const strokeWidth = Number.isNaN(Number(strokeWidthAttr)) ? 1 : Number(strokeWidthAttr);

  return { fill, stroke, strokeWidth };
};

const optionConfig: NumberOptionConfig = {
  id: 'stroke-width',
  min: 0,
  precision: 1,
  sliderMax: 100,
  step: 0.1,
  unit: 'mm',
};
const optionConfigInch: NumberOptionConfig = {
  ...optionConfig,
  precision: 2,
  sliderMax: 127,
  step: 0.254,
  unit: 'in',
};

interface Props {
  elem: Element;
  fillOnly?: boolean;
  label?: string;
}

interface State {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

const ColorPanel = ({ elem, fillOnly = false, label }: Props): React.JSX.Element => {
  const isTablet = useIsTabletOrMobile();
  const lang = useI18n();
  const t = lang.beambox.right_panel.object_panel.option_panel;
  const [state, setState] = useState<State>(deriveElementState(elem));
  const { fill, stroke, strokeWidth } = state;
  const strokeWidthMm = strokeWidth / constant.dpmm;
  const isInch = useStorageStore((state) => state.isInch);
  const config = useMemo(() => (isInch ? optionConfigInch : optionConfig), [isInch]);

  useDidUpdateEffect(() => {
    setState(deriveElementState(elem));
  }, [elem]);

  const handleFillColorChange = useCallback(
    (newColor: string, actual = true) => {
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
        setState((prev) => ({ ...prev, fill: newColor }));
      }
    },
    [elem],
  );

  const handleStrokeColorChange = useCallback(
    (newColor: string, actual = true) => {
      svgCanvas.undoMgr.beginUndoableChange('stroke', [elem]);
      svgCanvas.changeSelectedAttributeNoUndo('stroke', newColor, [elem]);

      const cmd = svgCanvas.undoMgr.finishUndoableChange();

      if (actual) {
        if (!cmd.isEmpty()) {
          svgCanvas.undoMgr.addCommandToHistory(cmd);
        }

        setState((prev) => ({ ...prev, stroke: newColor }));
      }
    },
    [elem],
  );

  const handleStrokeWidthChange = useCallback(
    (val: null | number, actual = true) => {
      if (val === null) return;

      const newVal = val * constant.dpmm;

      if (actual) {
        svgCanvas.changeSelectedAttribute('stroke-width', newVal, [elem]);
        setState((prev) => ({ ...prev, strokeWidth: newVal }));
      } else {
        svgCanvas.changeSelectedAttributeNoUndo('stroke-width', newVal, [elem]);
      }
    },
    [elem],
  );

  return isTablet ? (
    <ObjectPanelItem
      icon={<OptionPanelIcons.Color />}
      id={label ?? 'color'}
      renderContent={() => (
        <Tabs
          items={[
            {
              children: <ColorPickerMobile allowClear color={fill} onChange={handleFillColorChange} />,
              key: 'fill',
              label: t.fill,
            },
            ...(fillOnly
              ? []
              : [
                  {
                    children: (
                      <Content>
                        <div>
                          <Label>{t.stroke_color}</Label>
                          <ColorPickerMobile
                            color={strokeWidth === 0 ? 'none' : stroke}
                            onChange={handleStrokeColorChange}
                            triggerType="stroke"
                          />
                        </div>
                        <div className={styles.field}>
                          <Label extra={<ValueDisplay config={config} isInch={isInch} value={strokeWidthMm} />}>
                            {t.stroke_width}
                          </Label>
                          <Slider
                            config={config}
                            isInch={isInch}
                            onChange={handleStrokeWidthChange}
                            value={strokeWidthMm}
                          />
                        </div>
                      </Content>
                    ),
                    key: 'stroke',
                    label: t.stroke,
                  },
                ]),
          ]}
        />
      )}
      title={label ? `${t.color} (${label})` : t.color}
    />
  ) : (
    <>
      <div className={styles.block}>
        <div className={styles.label}>{t.fill}</div>
        <ColorPicker allowClear initColor={fill} onChange={handleFillColorChange} />
      </div>
      {!fillOnly && (
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
              <UnitInput
                id={config.id}
                isInch={isInch}
                min={config.min}
                onChange={handleStrokeWidthChange}
                precision={config.precision}
                step={config.step}
                value={strokeWidthMm}
              />
            </ConfigProvider>
          </div>
        </div>
      )}
    </>
  );
};

export default ColorPanel;
