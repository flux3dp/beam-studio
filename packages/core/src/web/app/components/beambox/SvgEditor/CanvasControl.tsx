import React, { use, useCallback, useEffect, useMemo, useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Slider } from 'antd';
import type { MenuProps } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import macOSWindowSize from '@core/app/constants/macOS-Window-Size';
import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import workareaManager from '@core/app/svgedit/workarea';
import FormatDuration from '@core/helpers/duration-formatter';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import useI18n from '@core/helpers/useI18n';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import os from '@core/implementations/os';

import styles from './CanvasControl.module.scss';
import PreviewSlider from './PreviewSlider';

type CanvasControlMode = 'exposure' | 'opacity' | 'time' | 'zoom';

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

const hasPreviewImage = (): boolean => {
  const container = document.querySelector('#previewSvg');

  return Boolean(container?.querySelector('#backgroundImage'));
};

interface Props {
  getZoom?: () => number;
  setZoom?: (zoom: number) => void;
}

const CanvasControl = ({ getZoom, setZoom }: Props): React.ReactNode => {
  const [activeMode, setActiveMode] = useState<CanvasControlMode>('zoom');
  const { isPreviewMode } = useCameraPreviewStore();
  const lang = useI18n();

  const [opacity, setOpacity] = useState(1);
  const [hasBgImage, setHasBgImage] = useState(false);

  const updateBgOpacity = useCallback((val: number) => {
    const container: null | SVGGElement = document.querySelector('#previewSvg');

    if (container) container.style.opacity = String(val);
  }, []);

  useEffect(() => {
    if (isPreviewMode) {
      setHasBgImage(false);
    } else {
      const exists = hasPreviewImage();

      setHasBgImage(exists);

      if (exists) updateBgOpacity(opacity);
    }
  }, [isPreviewMode, opacity, updateBgOpacity]);

  useEffect(() => {
    if (isPreviewMode) {
      setActiveMode('exposure');
    } else {
      setActiveMode((prev) => {
        if (prev === 'exposure') return hasPreviewImage() ? 'opacity' : 'zoom';

        return prev;
      });
    }
  }, [isPreviewMode]);

  const [dpmm, setDpmm] = useState(96 / 25.4);
  const [displayRatio, setDisplayRatio] = useState(1);

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

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        icon: <span className={styles.zoomIcon}>⤢</span>,
        key: 'zoom',
        label: lang.zoom_block.canvas_zoom,
      },
    ];

    if (isPreviewMode) {
      items.push({
        icon: <WorkareaIcons.Exposure />,
        key: 'exposure',
        label: lang.zoom_block.exposure,
      });
    } else if (hasBgImage) {
      items.push({
        icon: <WorkareaIcons.Opacity />,
        key: 'opacity',
        label: lang.zoom_block.opacity,
      });
    }

    items.push({
      icon: <WorkareaIcons.Time />,
      key: 'time',
      label: lang.beambox.time_est_button.calculate,
    });

    return items;
  }, [isPreviewMode, hasBgImage, lang]);

  const renderContent = () => {
    if (activeMode === 'exposure') {
      return <PreviewSlider />;
    }

    if (activeMode === 'opacity') {
      return (
        <>
          <Slider
            className={styles.slider}
            max={1}
            min={0}
            onChange={(val: number) => {
              setOpacity(val);
              updateBgOpacity(val);
            }}
            step={0.25}
            tooltip={{ open: false }}
            value={opacity}
          />
          <div className={styles.value}>{opacity * 100}%</div>
        </>
      );
    }

    if (activeMode === 'time') {
      return (
        <div className={styles.timeDisplay} onClick={calculateEstimatedTime}>
          {typeof displayTime === 'number' ? (
            FormatDuration(Math.max(displayTime, 1))
          ) : (
            <>{lang.zoom_block.estimate_time}</>
          )}
        </div>
      );
    }

    if (activeMode === 'zoom') {
      return (
        <div className={styles.zoomContent}>
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
      );
    }

    return null;
  };

  const renderModeIcon = () => {
    if (activeMode === 'exposure') return <WorkareaIcons.Exposure className={styles.icon} />;

    if (activeMode === 'opacity') return <WorkareaIcons.Opacity className={styles.icon} />;

    if (activeMode === 'time') return <WorkareaIcons.Time className={styles.icon} />;

    return <span className={styles.zoomIcon}>⤢</span>;
  };

  return (
    <div>
      <div className={styles.container}>
        <Dropdown
          menu={{
            items: menuItems,
            onClick: ({ key }) => setActiveMode(key as CanvasControlMode),
            selectedKeys: [activeMode],
          }}
          placement="top"
          trigger={['click']}
        >
          <div className={styles.triggerArea}>
            {renderModeIcon()}
            <DownOutlined style={{ fontSize: '10px' }} />
          </div>
        </Dropdown>
        <div className={styles.divider} />
        {renderContent()}
      </div>
    </div>
  );
};

export default CanvasControl;
