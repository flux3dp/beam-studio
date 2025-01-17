import React, { useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import macOSWindowSize from 'app/constants/macOS-Window-Size';
import os from 'implementations/os';
import useI18n from 'helpers/useI18n';
import workareaManager from 'app/svgedit/workarea';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'helpers/react-contextmenu';
import { useIsMobile } from 'helpers/system-helper';

import styles from './ZoomBlock.module.scss';

const eventEmitter = eventEmitterFactory.createEventEmitter('zoom-block');

let dpmmCache: number;
const calculateDpmm = async (): Promise<number> => {
  if (dpmmCache) return dpmmCache;
  try {
    if (window.os === 'MacOS') {
      const res = await os.process.exec(
        '/usr/sbin/system_profiler SPHardwareDataType | grep Identifier'
      );
      if (!res.stderr) {
        const match = res.stdout.match(/Model Identifier: (.+\b)/);
        if (match) {
          const modelId = match[1];
          const monitorSize = macOSWindowSize[modelId];
          if (monitorSize) {
            const dpi = Math.hypot(window.screen.width, window.screen.height) / monitorSize;
            const dpmm = dpi / 25.4;
            return dpmm;
          }
        }
      }
    } else if (window.os === 'Windows') {
      const res = await os.process.exec(
        'powershell "Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBasicDisplayParams"'
      );
      if (!res.stderr) {
        const matchWidth = res.stdout.match(/MaxHorizontalImageSize[ ]*: (\d+)\b/);
        const matchHeight = res.stdout.match(/MaxVerticalImageSize[ ]*: (\d+)\b/);
        if (matchWidth && matchHeight) {
          const width = Number(matchWidth[1]);
          const height = Number(matchHeight[1]);
          if (!Number.isNaN(width) && !Number.isNaN(height)) {
            const dpmmW = window.screen.width / (width * 10);
            const dpmmH = window.screen.height / (height * 10);
            const avgDpmm = (dpmmW + dpmmH) / 2;
            return avgDpmm;
          }
        } else if (matchWidth) {
          const width = Number(matchWidth[1]);
          if (!Number.isNaN(width)) {
            const dpmm = window.screen.width / (width * 10);
            return dpmm;
          }
        } else if (matchHeight) {
          const height = Number(matchHeight[1]);
          if (!Number.isNaN(height)) {
            const dpmm = window.screen.height / (height * 10);
            return dpmm;
          }
        }
      }
    } else if (window.os === 'Linux') {
      const res = await os.process.exec("xrandr | grep ' connected'");
      if (!res.stderr) {
        const matches = res.stdout.match(/\d+x\d+\+\d+\+\d+ \d+mm x \d+mm\b/g);
        if (matches && matches.length > 0) {
          for (let i = 0; i < matches.length; i += 1) {
            const match = matches[i].match(/(\d+)x(\d+)\+\d+\+\d+ (\d+)mm x (\d+)mm\b/);
            if (match) {
              const [, resW, resH, width, height] = match;
              if (
                Number(resW) === window.screen.width &&
                Number(resH) === window.screen.height &&
                width > 0 &&
                height > 0
              ) {
                const dpmm = (window.screen.width / width + window.screen.height / height) / 2;
                return dpmm;
              }
            }
          }
        }
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
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
  setZoom: (zoom: number) => void;
  resetView: () => void;
  isPathPreviewing?: boolean;
  className?: string;
}

const ZoomBlock = ({
  getZoom,
  setZoom,
  resetView,
  isPathPreviewing,
  className,
}: Props): JSX.Element => {
  const lang = useI18n().beambox.zoom_block;
  const [dpmm, setDpmm] = useState(96 / 25.4);
  const [displayRatio, setDisplayRatio] = useState(1);
  const isMobile = useIsMobile();
  const contextMenuId = useMemo(() => {
    const id = Math.round(Math.random() * 10000);
    return `zoom-block-contextmenu-${id}`;
  }, []);

  useEffect(() => {
    getDpmm().then((res) => setDpmm(res));
  }, []);

  const calculateCurrentRatio = useCallback(() => {
    if (!dpmm) return null;
    const zoom = getZoom ? getZoom() : workareaManager.zoomRatio * constant.dpmm;
    const ratio = zoom / dpmm;
    return ratio;
  }, [dpmm, getZoom]);

  useEffect(() => {
    const getRatio = () => {
      const ratio = calculateCurrentRatio();
      if (ratio) setDisplayRatio(ratio);
    };
    getRatio();
  }, [calculateCurrentRatio]);

  useEffect(() => {
    const update = () => setDisplayRatio(calculateCurrentRatio() ?? 1);
    eventEmitter.on('UPDATE_ZOOM_BLOCK', update);
    return () => {
      eventEmitter.removeListener('UPDATE_ZOOM_BLOCK', update);
    };
  }, [calculateCurrentRatio]);

  const setRatio = useCallback(
    (ratioPercentage: number) => {
      const newRatio = ratioPercentage / 100;
      const targetZoom = newRatio * dpmm;
      setZoom(targetZoom);
    },
    [dpmm, setZoom]
  );

  const zoomIn = useCallback(
    (currentRatio: number) => {
      const ratioInPercent = Math.round(currentRatio * 100);
      let targetRatio: number;
      if (ratioInPercent < 500) {
        targetRatio = ratioInPercent + (10 - (ratioInPercent % 10) || 10);
      } else {
        targetRatio = ratioInPercent + (100 - (ratioInPercent % 100) || 100);
      }
      setRatio(targetRatio);
    },
    [setRatio]
  );

  const zoomOut = useCallback(
    (currentRatio: number) => {
      const ratioInPercent = Math.round(currentRatio * 100);
      let targetRatio: number;
      if (ratioInPercent <= 500) {
        targetRatio = ratioInPercent - (ratioInPercent % 10 || 10);
      } else {
        targetRatio = ratioInPercent - (ratioInPercent % 100 || 100);
      }
      setRatio(targetRatio);
    },
    [setRatio]
  );

  return (
    <div
      className={classNames(
        styles.container,
        {
          [styles['path-preview']]: isPathPreviewing,
          [styles.mobile]: isMobile,
        },
        className
      )}
    >
      <ContextMenuTrigger id={contextMenuId} holdToDisplay={-1} holdToDisplayMouse={-1}>
        <div className={styles.btn} onClick={() => zoomOut(displayRatio)}>
          <img src="img/icon-minus.svg" />
        </div>
        <ContextMenuTrigger id={contextMenuId} holdToDisplay={0} holdToDisplayMouse={0}>
          <div className={styles.ratio}>{`${Math.round(displayRatio * 100)}%`}</div>
        </ContextMenuTrigger>
        <div className={styles.btn} onClick={() => zoomIn(displayRatio)}>
          <img src="img/icon-plus.svg" />
        </div>
      </ContextMenuTrigger>
      <ContextMenu id={contextMenuId}>
        <MenuItem attributes={{ id: 'fit_to_window' }} onClick={resetView}>
          {lang.fit_to_window}
        </MenuItem>
        <MenuItem attributes={{ id: 'ratio_25%' }} onClick={() => setRatio(25)}>
          25 %
        </MenuItem>
        <MenuItem attributes={{ id: 'ratio_50%' }} onClick={() => setRatio(50)}>
          50 %
        </MenuItem>
        <MenuItem attributes={{ id: 'ratio_75%' }} onClick={() => setRatio(75)}>
          75 %
        </MenuItem>
        <MenuItem attributes={{ id: 'ratio_100%' }} onClick={() => setRatio(100)}>
          100 %
        </MenuItem>
        <MenuItem attributes={{ id: 'ratio_150%' }} onClick={() => setRatio(150)}>
          150 %
        </MenuItem>
        <MenuItem attributes={{ id: 'ratio_200%' }} onClick={() => setRatio(200)}>
          200 %
        </MenuItem>
      </ContextMenu>
    </div>
  );
};

export default ZoomBlock;
