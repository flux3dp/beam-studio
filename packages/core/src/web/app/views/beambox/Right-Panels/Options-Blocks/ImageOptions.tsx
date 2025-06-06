import React, { Fragment, useCallback, useContext, useMemo, useRef } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { ConfigProvider, InputNumber, Slider, Switch } from 'antd';
import { Popover } from 'antd-mobile';
import classNames from 'classnames';

import { promarkModels } from '@core/app/actions/beambox/constant';
import { sliderTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import history from '@core/app/svgedit/history/history';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import i18n from '@core/helpers/i18n';
import ImageData from '@core/helpers/image-data';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import browser from '@core/implementations/browser';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { IImageDataResult } from '@core/interfaces/IImage';

import styles from './ImageOptions.module.scss';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

interface Props {
  elem: Element;
}

const ImageOptions = ({ elem }: Props): React.JSX.Element => {
  const { updateObjectPanel } = useContext(ObjectPanelContext);
  const thresholdCache = useRef(Array.from({ length: 256 }).fill(null));
  const curCallID = useRef(0);
  const nextCallID = useRef(1);
  // FIXME: Swiftray Gcode converter(Promark) treat transparent pixel as white pixel
  // This is a temporary workaround to prevent engraving of transparent pixels when threshold is set to 255
  const workarea = useWorkarea();
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const maxThreshold = useMemo(() => (isPromark ? 254 : 255), [isPromark]);

  const changeAttribute = useCallback(
    (changes: { [key: string]: boolean | number | string }): void => {
      const batchCommand: IBatchCommand = new history.BatchCommand('Image Option Panel');
      const setAttribute = (key: string, value: boolean | number | string) => {
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
    [elem],
  );

  const generateImageData = useCallback(
    (isShading: boolean, threshold: number): Promise<IImageDataResult> =>
      new Promise<IImageDataResult>((resolve) => {
        ImageData(elem.getAttribute('origImage'), {
          grayscale: {
            is_rgba: true,
            is_shading: isShading,
            is_svg: false,
            threshold,
          },
          height: Number.parseFloat(elem.getAttribute('height')),
          onComplete: (result: IImageDataResult) => {
            resolve(result);
          },
          width: Number.parseFloat(elem.getAttribute('width')),
        });
      }),
    [elem],
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
    [elem, changeAttribute, generateImageData, updateObjectPanel],
  );

  const isGradient = elem.getAttribute('data-shading') === 'true';
  const isPwm = elem.getAttribute('data-pwm') === '1';
  const activeKey = ObjectPanelController.getActiveKey();
  const thresholdVisible = useMemo(() => activeKey === 'threshold', [activeKey]);
  const shouldShowPwm = useMemo(() => !isPromark && isGradient, [isPromark, isGradient]);
  const gradientBlock = isMobile() ? (
    <>
      <ObjectPanelItem.Item
        content={<Switch checked={isGradient} />}
        id="gradient"
        label={LANG.shading}
        onClick={handleGradientClick}
      />
      {shouldShowPwm && (
        <ObjectPanelItem.Item
          content={<Switch checked={isPwm} />}
          id="pwm"
          label={LANG.pwm_engraving}
          onClick={handlePwmClick}
        />
      )}
    </>
  ) : (
    <>
      <div className={styles['option-block']} key="gradient">
        <div className={styles.label}>{LANG.shading}</div>
        <Switch checked={isGradient} onChange={handleGradientClick} size="small" />
      </div>
      {shouldShowPwm && (
        <div className={styles['option-block']} key="pwm">
          <div className={styles.label}>
            {LANG.pwm_engraving}
            <QuestionCircleOutlined className={styles.icon} onClick={() => browser.open(LANG.pwm_engraving_link)} />
          </div>
          <Switch checked={isPwm} onChange={handlePwmClick} size="small" />
        </div>
      )}
    </>
  );

  let thresholdBlock = null;

  if (!isGradient) {
    const threshold = Number.parseInt(elem.getAttribute('data-threshold'), 10) || 128;

    thresholdBlock = isMobile() ? (
      <Popover
        content={
          <div className={styles.field}>
            <span className={styles.label}>{LANG.threshold_short}</span>
            <ConfigProvider theme={{ token: { borderRadius: 100 } }}>
              <InputNumber
                className={styles.input}
                controls={false}
                max={maxThreshold}
                min={1}
                onChange={handleThresholdChange}
                precision={0}
                type="number"
                value={threshold}
              />
            </ConfigProvider>
            <Slider
              className={styles.slider}
              marks={{ 128: '128' }}
              max={maxThreshold}
              min={1}
              onChange={handleThresholdChange}
              step={1}
              value={threshold}
            />
          </div>
        }
        visible={thresholdVisible}
      >
        <ObjectPanelItem.Item
          autoClose={false}
          content={<OptionPanelIcons.Threshold />}
          id="threshold"
          label={LANG.threshold_short}
        />
      </Popover>
    ) : (
      <Fragment key="threshold">
        <div className={classNames(styles['option-block'], styles['with-slider'])}>
          <div className={styles.label}>{LANG.threshold}</div>
          <UnitInput
            className={{ [styles['option-input']]: true }}
            decimal={0}
            defaultValue={threshold}
            getValue={handleThresholdChange}
            max={maxThreshold}
            min={1}
            unit=""
          />
        </div>
        <ConfigProvider theme={sliderTheme}>
          <Slider max={maxThreshold} min={1} onChange={handleThresholdChange} step={1} value={threshold} />
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
