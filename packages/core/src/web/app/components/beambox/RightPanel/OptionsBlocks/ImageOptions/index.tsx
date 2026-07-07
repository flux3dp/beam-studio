import React, { use, useCallback, useEffect, useMemo, useRef } from 'react';

import { promarkModels } from '@core/app/actions/beambox/constant';
import DepthBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/ImageOptions/DepthBlock';
import GradientBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/ImageOptions/GradientBlock';
import PwmBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/ImageOptions/PwmBlock';
import ThresholdBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/ImageOptions/ThresholdBlock';
import { useIsMobile } from '@core/app/stores/screenStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { useAsyncTask } from '@core/helpers/hooks/useAsyncTask';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import ImageData from '@core/helpers/image-data';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { ObjectPanelContext } from '../../contexts/ObjectPanelContext';
import ObjectPanelController from '../../contexts/ObjectPanelController';

import styles from './ImageOptions.module.scss';

const getCacheIndex = (isShading: boolean, threshold: number) => (isShading ? 0 : threshold);

interface Props {
  elem: Element;
}

const ImageOptions = ({ elem }: Props): React.ReactNode => {
  const isMobile = useIsMobile();
  const { updateObjectPanel } = use(ObjectPanelContext);
  // thresholdCache: index 0 means gradient, 1-255 means threshold value
  const thresholdCache = useRef(Array.from<null | string>({ length: 256 }).fill(null));
  const { checkIsLatestCall, getNextCallID } = useAsyncTask();
  const elemRef = useRef(-1);
  const workarea = useWorkarea();
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const isGradient = elem.getAttribute('data-shading') === 'true';
  const threshold = Number.parseInt(elem.getAttribute('data-threshold') ?? '128', 10) || 128;

  useEffect(() => {
    elemRef.current = getNextCallID();
    thresholdCache.current = Array.from<null | string>({ length: 256 }).fill(null);
    thresholdCache.current[getCacheIndex(isGradient, threshold)] = elem.getAttribute('xlink:href');
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [elem]);

  const changeAttribute = useCallback(
    (changes: { [key: string]: boolean | number | string }): void => {
      const batchCommand: IBatchCommand = new history.BatchCommand('Image Option Panel');
      const setAttribute = (key: string, value: boolean | number | string) => {
        undoManager.beginUndoableChange(key, [elem]);
        elem.setAttribute(key, value as string);

        const cmd = undoManager.finishUndoableChange();

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
        undoManager.addCommandToHistory(batchCommand);
      }

      // Force update this component
      updateObjectPanel();
    },
    [elem, updateObjectPanel],
  );

  const generateImageData = useCallback(
    async (isShading: boolean, threshold: number): Promise<string> => {
      const callID = elemRef.current;
      const index = getCacheIndex(isShading, threshold);

      if (thresholdCache.current[index]) return thresholdCache.current[index];

      const pngBase64 = await new Promise<string>((resolve) => {
        ImageData(elem.getAttribute('origImage')!, {
          grayscale: {
            is_rgba: true,
            is_shading: isShading,
            is_svg: false,
            threshold,
          },
          height: Number.parseFloat(elem.getAttribute('height') || '0'),
          onComplete: (result) => {
            resolve(result.pngBase64);
          },
          width: Number.parseFloat(elem.getAttribute('width') || '0'),
        });
      });

      if (checkIsLatestCall(callID)) {
        thresholdCache.current[index] = pngBase64;
      }

      return pngBase64;
    },
    [elem, checkIsLatestCall],
  );

  const content = useMemo(() => {
    const blocks = [
      <GradientBlock
        changeAttribute={changeAttribute}
        generateImageData={generateImageData}
        isGradient={isGradient}
        key="gradient"
      />,
    ];

    if (isGradient) {
      if (isPromark) {
        if (!isMobile) {
          blocks.push(<DepthBlock changeAttribute={changeAttribute} elem={elem} key="depth" />);
        }
      } else {
        blocks.push(<PwmBlock changeAttribute={changeAttribute} elem={elem} key="pwm" />);
      }
    } else {
      blocks.push(
        <ThresholdBlock
          changeAttribute={changeAttribute}
          generateImageData={generateImageData}
          key="threshold"
          threshold={threshold}
        />,
      );
    }

    return blocks;
  }, [changeAttribute, generateImageData, isGradient, isPromark, isMobile, elem, threshold]);

  return isMobile ? content : <div className={styles.options}>{content}</div>;
};

export default ImageOptions;
