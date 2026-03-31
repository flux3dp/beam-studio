import React, { use, useCallback, useEffect, useMemo, useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { ConfigProvider, Slider, Space, Switch, Tooltip } from 'antd';

import constant, { supportCameraAutoExposureModels } from '@core/app/actions/beambox/constant';
import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import macOSWindowSize from '@core/app/constants/macOS-Window-Size';
import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import { getExposureSettings, setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import FormatDuration from '@core/helpers/duration-formatter';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import useI18n from '@core/helpers/useI18n';
import versionChecker from '@core/helpers/version-checker';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import os from '@core/implementations/os';
import type { IConfigSetting } from '@core/interfaces/IDevice';

import styles from './CanvasSlider.module.scss';

const zoomEventEmitter = eventEmitterFactory.createEventEmitter('zoom-block');

let dpmmCache: number;
const calculateDpmm = async (): Promise<number> => {
  if (dpmmCache) return dpmmCache;

  try {
    const osName = getOS();

    if (osName === 'MacOS') {
      const res = await os.process.exec('/usr/sbin/system_profiler SPHardwareDataType | grep Identifier');

      if (!res.stderr) {
        const match = res.stdout.match(/Model Identifier: (.+\b)/);

        if (match) {
          const modelId = match[1] as keyof typeof macOSWindowSize;
          const monitorSize = macOSWindowSize[modelId];

          if (monitorSize) return Math.hypot(window.screen.width, window.screen.height) / monitorSize / 25.4;
        }
      }
    } else if (osName === 'Windows') {
      const res = await os.process.exec(
        'powershell "Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBasicDisplayParams"',
      );

      if (!res.stderr) {
        const matchWidth = res.stdout.match(/MaxHorizontalImageSize[ ]*: (\d+)\b/);
        const matchHeight = res.stdout.match(/MaxVerticalImageSize[ ]*: (\d+)\b/);

        if (matchWidth && matchHeight) {
          const dpmmW = window.screen.width / (Number(matchWidth[1]) * 10);
          const dpmmH = window.screen.height / (Number(matchHeight[1]) * 10);

          return (dpmmW + dpmmH) / 2;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  return 96 / 25.4;
};

const getDpmm = async (): Promise<number> => {
  if (dpmmCache) return dpmmCache;

  dpmmCache = await calculateDpmm();

  return dpmmCache;
};

interface Props {
  getZoom?: () => number;
  resetView?: () => void;
  setZoom?: (zoom: number) => void;
}

const CanvasSlider = ({ getZoom, setZoom }: Props): React.ReactNode => {
  const [opacity, setOpacity] = useState(1);
  const [showOpacity, setShowOpacity] = useState(false);
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const [autoExposure, setAutoExposure] = useState<boolean | null>(null);
  const [isSettingAutoExposure, setIsSettingAutoExposure] = useState(false);
  const [isRawMode, setIsRawMode] = useState(false);
  const { isDrawing, isPreviewMode, previewMode } = useCameraPreviewStore();

  const lang = useI18n();
  const { estimatedTime, setEstimatedTime } = use(TimeEstimationButtonContext);
  const [localTime, setLocalTime] = useState<null | number>(null);
  const displayTime = localTime !== null ? localTime : estimatedTime;

  const calculateEstimatedTime = async () => {
    webNeedConnectionWrapper(async () => {
      const estimateTime = await ExportFuncs.estimateTime();

      setLocalTime(estimateTime);

      if (typeof setEstimatedTime === 'function') setEstimatedTime(estimateTime);
    });
  };

  const [dpmm, setDpmm] = useState(96 / 25.4);
  const [displayRatio, setDisplayRatio] = useState(1);
  const [isTargetScreen, setIsTargetScreen] = useState(false);
  const [activeMode, setActiveMode] = useState<'opacity' | 'time' | 'zoom'>('opacity');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const w = window.innerWidth;

      setIsTargetScreen(w === 600 || w === 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    getDpmm().then((res) => setDpmm(res));
  }, []);

  const calculateCurrentRatio = useCallback(() => {
    if (!dpmm) return null;

    const zoom = getZoom ? getZoom() : workareaManager.zoomRatio * constant.dpmm;

    return zoom / dpmm;
  }, [dpmm, getZoom]);

  useEffect(() => {
    const ratio = calculateCurrentRatio();

    if (ratio) setDisplayRatio(ratio);
  }, [calculateCurrentRatio]);

  useEffect(() => {
    const update = () => setDisplayRatio(calculateCurrentRatio() ?? 1);

    zoomEventEmitter.on('UPDATE_ZOOM_BLOCK', update);

    return () => {
      zoomEventEmitter.removeListener('UPDATE_ZOOM_BLOCK', update);
    };
  }, [calculateCurrentRatio]);

  const zoomIn = useCallback(
    (currentRatio: number) => {
      const ratioInPercent = Math.round(currentRatio * 100);
      const factor = ratioInPercent < 500 ? 10 : 100;
      const targetRatio = ratioInPercent + (factor - (ratioInPercent % factor) || factor);

      if (setZoom) setZoom((targetRatio / 100) * dpmm);
    },
    [dpmm, setZoom],
  );

  const zoomOut = useCallback(
    (currentRatio: number) => {
      const ratioInPercent = Math.round(currentRatio * 100);
      const factor = ratioInPercent <= 500 ? 10 : 100;
      const targetRatio = ratioInPercent - (ratioInPercent % factor || factor);

      if (setZoom) setZoom((targetRatio / 100) * dpmm);
    },
    [dpmm, setZoom],
  );

  const toggleAutoExposure = async (value: boolean) => {
    if (isSettingAutoExposure) return;

    try {
      useGlobalPreferenceStore.getState().set('use-auto-exposure', false);
      setIsSettingAutoExposure(true);

      const res = await deviceMaster?.setCameraExposureAuto(value);

      if (res) setAutoExposure(value);
    } catch (e) {
      console.error('Failed to set auto exposure', e);
    } finally {
      setIsSettingAutoExposure(false);
    }
  };

  const getSetting = async () => {
    if (!deviceMaster?.currentDevice?.info) return;

    const { model, version } = deviceMaster.currentDevice.info;
    const vc = versionChecker(version);

    if (!constant.fcodeV2Models.has(model)) return;

    const getExposure = async () => {
      if (model === 'fbb2' && !vc.meetRequirement('BB2_SEPARATE_EXPOSURE')) return;

      try {
        setExposureSetting(await getExposureSettings());
      } catch (e) {
        console.error(e);
        setExposureSetting(null);
      }
    };

    const getAutoExposure = async () => {
      if (!supportCameraAutoExposureModels.includes(model)) return;

      if (model === 'fbb2' && !vc.meetRequirement('BB2_AUTO_EXPOSURE')) return;

      try {
        if (useGlobalPreferenceStore.getState()['use-auto-exposure']) await deviceMaster.setCameraExposureAuto(true);

        const res = await deviceMaster.getCameraExposureAuto();

        if (res?.success) setAutoExposure(res.data);
      } catch (e) {
        console.error(e);
        setAutoExposure(null);
      }
    };

    getExposure();
    getAutoExposure();
    setIsRawMode(deviceMaster.currentControlMode === 'raw');
  };

  const updateBgOpacity = useCallback(
    (val: string) => {
      const container: null | SVGGElement = document.querySelector('#previewSvg');
      const bgImg: HTMLElement | null | undefined = container?.querySelector('#backgroundImage');

      if (container && (isPreviewMode || bgImg)) {
        container.style.opacity = val;
        setShowOpacity(true);
      } else {
        setShowOpacity(false);
      }
    },
    [isPreviewMode],
  );

  useEffect(() => {
    updateBgOpacity(isPreviewMode ? '1' : opacity.toString());
  }, [isPreviewMode, opacity, updateBgOpacity]);

  // this is also triggered by UPDATE_CONTEXT event in PreviewModeController.start
  useEffect(() => {
    setExposureSetting(null);
    setAutoExposure(null);

    if (isPreviewMode) getSetting();
  }, [isPreviewMode]);

  const showAutoExposure = useMemo(() => {
    if (autoExposure === null) return false;

    if (previewMode === PreviewMode.FULL_AREA && deviceMaster.currentDevice?.info.model === 'fbm2') return false;

    return true;
  }, [autoExposure, previewMode]);

  if (isTargetScreen) {
    return (
      <div style={{ position: 'relative' }}>
        {isMenuOpen && (
          <div className={styles.popoverMenu}>
            <div
              className={`${styles.menuItem} ${activeMode === 'zoom' ? styles.active : ''}`}
              onClick={() => {
                setActiveMode('zoom');
                setIsMenuOpen(false);
              }}
            >
              <span className={styles.zoomIcon}>⤢</span> {lang.zoom_block.canvas_zoom}
            </div>
            <div
              className={`${styles.menuItem} ${activeMode === 'opacity' ? styles.active : ''}`}
              onClick={() => {
                setActiveMode('opacity');
                setIsMenuOpen(false);
              }}
            >
              {isPreviewMode ? (
                <>
                  <WorkareaIcons.Exposure /> {lang.zoom_block.exposure}
                </>
              ) : (
                <>
                  <WorkareaIcons.Opacity /> {lang.zoom_block.opacity}
                </>
              )}
            </div>
            <div
              className={`${styles.menuItem} ${activeMode === 'time' ? styles.active : ''}`}
              onClick={() => {
                setActiveMode('time');
                setIsMenuOpen(false);
              }}
            >
              <WorkareaIcons.Time /> {lang.beambox.time_est_button.calculate}
            </div>
          </div>
        )}

        <div className={styles.container}>
          <div className={styles.triggerArea} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {activeMode === 'opacity' &&
              (isPreviewMode ? (
                <WorkareaIcons.Exposure className={styles.icon} />
              ) : (
                <WorkareaIcons.Opacity className={styles.icon} />
              ))}
            {activeMode === 'time' && <WorkareaIcons.Time className={styles.icon} />}
            {activeMode === 'zoom' && <span className={styles.zoomIcon}>⤢</span>}
            <DownOutlined style={{ fontSize: '10px' }} />
          </div>
          <div className={styles.divider} />
          {activeMode === 'opacity' &&
            (!isPreviewMode ? (
              <>
                <Slider
                  className={styles.slider}
                  max={1}
                  min={0}
                  onChange={setOpacity}
                  step={0.25}
                  tooltip={{ open: false }}
                  value={opacity}
                />
                <div className={styles.value}>{opacity * 100}%</div>
              </>
            ) : (
              exposureSetting && (
                <ConfigProvider
                  theme={{ components: { Slider: { trackBgDisabled: '#bfbfbf' } }, token: { colorPrimary: '#1890ff' } }}
                >
                  <Slider
                    className={styles.slider}
                    disabled={(isRawMode && isDrawing) || Boolean(autoExposure)}
                    max={Math.min(exposureSetting.max, 2000)}
                    min={Math.max(exposureSetting.min, 50)}
                    onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
                    onChangeComplete={async (value: number) => {
                      if (isRawMode && isDrawing) return;

                      setExposureSetting({ ...exposureSetting, value });
                      try {
                        await setExposure(value);
                      } catch (e) {
                        console.error(e);
                      }

                      if (PreviewModeController.isFullArea) await PreviewModeController.previewFullWorkarea();
                    }}
                    step={exposureSetting.step}
                    tooltip={{ open: false }}
                    value={exposureSetting.value}
                  />
                  <div className={styles.value}>{exposureSetting.value}</div>
                  {showAutoExposure && (
                    <Switch
                      checkedChildren="A"
                      className={styles.switch}
                      disabled={isDrawing}
                      loading={isSettingAutoExposure}
                      onChange={toggleAutoExposure}
                      unCheckedChildren="M"
                      value={autoExposure!}
                    />
                  )}
                </ConfigProvider>
              )
            ))}
          {activeMode === 'time' && (
            <div className={styles.timeDisplay} onClick={calculateEstimatedTime}>
              {typeof displayTime === 'number' ? (
                FormatDuration(Math.max(displayTime, 1))
              ) : (
                <>{lang.zoom_block.estimate_time}</>
              )}
            </div>
          )}
          {activeMode === 'zoom' && (
            <div className={styles.contentArea}>
              <div
                className={styles.actionBtn}
                onClick={() => zoomOut(displayRatio)}
                style={{ fontSize: '20px', userSelect: 'none' }}
              >
                －
              </div>
              <div className={styles.ratioDisplay}>{`${Math.round(displayRatio * 100)}%`}</div>
              <div
                className={styles.actionBtn}
                onClick={() => zoomIn(displayRatio)}
                style={{ fontSize: '20px', userSelect: 'none' }}
              >
                ＋
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Space className={styles.space} direction="vertical">
      {!isPreviewMode && showOpacity && (
        <div className={styles.container}>
          <Tooltip title={lang.editor.opacity}>
            <WorkareaIcons.Opacity className={styles.icon} />
          </Tooltip>
          <Slider
            className={styles.slider}
            max={1}
            min={0}
            onChange={setOpacity}
            step={0.25}
            tooltip={{ open: false }}
            value={opacity}
          />
          <div className={styles.value}>{opacity * 100}%</div>
        </div>
      )}
      {isPreviewMode && exposureSetting && (
        <div className={styles.container}>
          <Tooltip title={lang.editor.exposure}>
            <WorkareaIcons.Exposure className={styles.icon} />
          </Tooltip>
          <ConfigProvider
            theme={{
              components: { Slider: { trackBgDisabled: '#bfbfbf' } },
              token: { colorPrimary: '#1890ff', colorTextQuaternary: '#c0c0c0', colorTextTertiary: '#8c8c8c' },
            }}
          >
            <Slider
              className={styles.slider}
              disabled={(isRawMode && isDrawing) || (showAutoExposure && Boolean(autoExposure))}
              max={Math.min(exposureSetting.max, 2000)}
              min={Math.max(exposureSetting.min, 50)}
              onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
              onChangeComplete={async (value: number) => {
                if (isRawMode && isDrawing) return;

                setExposureSetting({ ...exposureSetting, value });

                try {
                  await setExposure(value);
                } catch (e) {
                  console.error('Failed to set exposure', e);
                }

                if (PreviewModeController.isFullArea) {
                  await PreviewModeController.previewFullWorkarea();
                }
              }}
              step={exposureSetting.step}
              tooltip={{ open: false }}
              value={exposureSetting.value}
            />
            <div className={styles.value}>{exposureSetting.value}</div>
            {showAutoExposure && (
              <Switch
                checkedChildren="A"
                className={styles.switch}
                disabled={isDrawing}
                loading={isSettingAutoExposure}
                onChange={toggleAutoExposure}
                unCheckedChildren="M"
                value={autoExposure!}
              />
            )}
          </ConfigProvider>
        </div>
      )}
    </Space>
  );
};

export default CanvasSlider;
