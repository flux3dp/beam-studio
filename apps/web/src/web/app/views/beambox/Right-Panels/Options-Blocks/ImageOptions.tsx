import classNames from 'classnames';
import React, { Fragment, useCallback, useMemo, useRef } from 'react';
import { ConfigProvider, InputNumber, Slider, Switch } from 'antd';
import { Popover } from 'antd-mobile';
import { QuestionCircleOutlined } from '@ant-design/icons';

import browser from 'implementations/browser';
import history from 'app/svgedit/history/history';
import ImageData from 'helpers/image-data';
import i18n from 'helpers/i18n';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionPanelIcons from 'app/icons/option-panel/OptionPanelIcons';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useWorkarea from 'helpers/hooks/useWorkarea';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';
import { IImageDataResult } from 'interfaces/IImage';
import { isMobile } from 'helpers/system-helper';
import { promarkModels } from 'app/actions/beambox/constant';
import { sliderTheme } from 'app/constants/antd-config';

import styles from './ImageOptions.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

interface Props {
  elem: Element;
  updateObjectPanel: () => void;
}

const ImageOptions = ({ elem, updateObjectPanel }: Props): JSX.Element => {
  const thresholdCache = useRef(new Array(256).fill(null));
  const curCallID = useRef(0);
  const nextCallID = useRef(1);
  // FIXME: Swiftray Gcode converter(Promark) treat transparent pixel as white pixel
  // This is a temporary workaround to prevent engraving of transparent pixels when threshold is set to 255
  const workarea = useWorkarea();
  const maxThreshold = useMemo(() => (promarkModels.has(workarea) ? 254 : 255), [workarea]);

  const changeAttribute = useCallback(
    (changes: { [key: string]: string | number | boolean }): void => {
      const batchCommand: IBatchCommand = new history.BatchCommand('Image Option Panel');
      const setAttribute = (key: string, value: string | number | boolean) => {
        svgCanvas.undoMgr.beginUndoableChange(key, [elem]);
        elem.setAttribute(key, value as string);
        const cmd = svgCanvas.undoMgr.finishUndoableChange();
        if (!cmd.isEmpty()) {
          batchCommand.addSubCommand(cmd);
        }
      };
      const keys = Object.keys(changes);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        setAttribute(key, changes[key]);
      }
      if (changes['data-pwm']) {
        ObjectPanelController.events.emit('pwm-changed');
        batchCommand.onAfter = () => {
          ObjectPanelController.events.emit('pwm-changed');
        };
      }
      if (!batchCommand.isEmpty()) {
        svgCanvas.undoMgr.addCommandToHistory(batchCommand);
      }
    },
    [elem]
  );

  const generateImageData = useCallback(
    (isShading: boolean, threshold: number): Promise<IImageDataResult> =>
      new Promise<IImageDataResult>((resolve) => {
        ImageData(elem.getAttribute('origImage'), {
          width: parseFloat(elem.getAttribute('width')),
          height: parseFloat(elem.getAttribute('height')),
          grayscale: {
            is_rgba: true,
            is_shading: isShading,
            threshold,
            is_svg: false,
          },
          onComplete: (result: IImageDataResult) => {
            resolve(result);
          },
        });
      }),
    [elem]
  );

  const handleGradientClick = useCallback(async () => {
    let isShading = elem.getAttribute('data-shading') === 'true';
    isShading = !isShading;
    const threshold = isShading ? 254 : 128;
    const imageData = await generateImageData(isShading, threshold);
    const { pngBase64 } = imageData;
    changeAttribute({
      'data-shading': isShading,
      'data-threshold': isShading ? 254 : 128,
      'xlink:href': pngBase64,
    });
    updateObjectPanel();
    LayerPanelController.checkGradient();
  }, [elem, changeAttribute, generateImageData, updateObjectPanel]);

  const handlePwmClick = useCallback(() => {
    const cur = elem.getAttribute('data-pwm') === '1';
    changeAttribute({
      'data-pwm': cur ? '0' : '1',
    });
    updateObjectPanel();
  }, [elem, changeAttribute, updateObjectPanel]);

  const handleThresholdChange = useCallback(
    async (val: number) => {
      const callID = nextCallID.current;
      nextCallID.current += 1;
      let result = thresholdCache.current[val];
      if (!result) {
        const isShading = elem.getAttribute('data-shading') === 'true';
        const imageData = await generateImageData(isShading, val);
        result = imageData.pngBase64;
        thresholdCache.current[val] = result;
      }
      if (callID >= curCallID.current) {
        curCallID.current = callID;
        changeAttribute({
          'data-threshold': val,
          'xlink:href': result,
        });
        updateObjectPanel();
      }
    },
    [elem, changeAttribute, generateImageData, updateObjectPanel]
  );

  const isGradient = elem.getAttribute('data-shading') === 'true';
  const isPwm = elem.getAttribute('data-pwm') === '1';
  const activeKey = ObjectPanelController.getActiveKey();
  const thresholdVisible = useMemo(() => activeKey === 'threshold', [activeKey]);
  const gradientBlock = isMobile() ? (
    <>
      <ObjectPanelItem.Item
        id="gradient"
        content={<Switch checked={isGradient} />}
        label={LANG.shading}
        onClick={handleGradientClick}
      />
      {isGradient && (
        <ObjectPanelItem.Item
          id="pwm"
          content={<Switch checked={isPwm} />}
          label={LANG.pwm_engraving}
          onClick={handlePwmClick}
        />
      )}
    </>
  ) : (
    <>
      <div className={styles['option-block']} key="gradient">
        <div className={styles.label}>{LANG.shading}</div>
        <Switch size="small" checked={isGradient} onChange={handleGradientClick} />
      </div>
      {isGradient && (
        <div className={styles['option-block']} key="pwm">
          <div className={styles.label}>
            {LANG.pwm_engraving}
            <QuestionCircleOutlined
              className={styles.icon}
              onClick={() => browser.open(LANG.pwm_engraving_link)}
            />
          </div>
          <Switch size="small" checked={isPwm} onChange={handlePwmClick} />
        </div>
      )}
    </>
  );

  let thresholdBlock = null;
  if (!isGradient) {
    const threshold = parseInt(elem.getAttribute('data-threshold'), 10) || 128;
    thresholdBlock = isMobile() ? (
      <Popover
        visible={thresholdVisible}
        content={
          <div className={styles.field}>
            <span className={styles.label}>{LANG.threshold_short}</span>
            <ConfigProvider theme={{ token: { borderRadius: 100 } }}>
              <InputNumber
                className={styles.input}
                type="number"
                min={1}
                max={maxThreshold}
                value={threshold}
                precision={0}
                onChange={handleThresholdChange}
                controls={false}
              />
            </ConfigProvider>
            <Slider
              className={styles.slider}
              min={1}
              max={maxThreshold}
              step={1}
              marks={{ 128: '128' }}
              value={threshold}
              onChange={handleThresholdChange}
            />
          </div>
        }
      >
        <ObjectPanelItem.Item
          id="threshold"
          content={<OptionPanelIcons.Threshold />}
          label={LANG.threshold_short}
          autoClose={false}
        />
      </Popover>
    ) : (
      <Fragment key="threshold">
        <div className={classNames(styles['option-block'], styles['with-slider'])}>
          <div className={styles.label}>{LANG.threshold}</div>
          <UnitInput
            min={1}
            max={maxThreshold}
            decimal={0}
            unit=""
            className={{ [styles['option-input']]: true }}
            defaultValue={threshold}
            getValue={handleThresholdChange}
          />
        </div>
        <ConfigProvider theme={sliderTheme}>
          <Slider
            min={1}
            max={maxThreshold}
            step={1}
            value={threshold}
            onChange={handleThresholdChange}
          />
        </ConfigProvider>
      </Fragment>
    );
  }

  return isMobile() ? (
    <>
      {gradientBlock}
      {thresholdBlock}
    </>
  ) : (
    <div className={styles.options}>
      {gradientBlock}
      {thresholdBlock}
    </div>
  );
};

export default ImageOptions;
