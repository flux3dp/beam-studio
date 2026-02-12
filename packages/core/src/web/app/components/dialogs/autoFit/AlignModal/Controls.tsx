import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';

import { Button, Flex } from 'antd';
import type Konva from 'konva';

import constant from '@core/app/actions/beambox/constant';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import round from '@core/helpers/math/round';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import styles from './Controls.module.scss';
import type { ImageDimension } from './dimension';
import { calculateDimensionCenter } from './dimension';

interface Props {
  contour: AutoFitContour;
  dimension: ImageDimension;
  imageRef: MutableRefObject<Konva.Image | null>;
  initDimension: ImageDimension;
  setDimension: Dispatch<SetStateAction<ImageDimension>>;
}

const Controls = ({ contour, dimension, imageRef, initDimension, setDimension }: Props): React.JSX.Element => {
  const { auto_fit: t } = useI18n();
  const { dpmm } = constant;
  const isInch = useStorageStore((state) => state.isInch);
  const initialCenter = useMemo(() => calculateDimensionCenter(initDimension), [initDimension]);

  const handleResetPosition = useCallback(() => {
    if (imageRef.current) {
      const { height, rotation, width, x, y } = initDimension;
      const image = imageRef.current;

      image.position({ x, y });
      image.width(width);
      image.height(height);
      image.rotation(rotation);
      setDimension({ ...initDimension });
    }
  }, [imageRef, initDimension, setDimension]);

  const { height, rotation, width } = dimension;
  const rad = (rotation * Math.PI) / 180;
  const { x: centerX, y: centerY } = useMemo(() => calculateDimensionCenter(dimension), [dimension]);
  const getSizeStr = useCallback(
    (w: number, h: number) => {
      const getDisplayValue = (val: number) => round(val / dpmm / (isInch ? 25.4 : 1), 2);

      return `${getDisplayValue(w)} x ${getDisplayValue(h)} ${isInch ? 'in' : 'mm'}`;
    },
    [dpmm, isInch],
  );

  const step = useMemo(() => (isInch ? 2.54 : 1), [isInch]);

  useEffect(() => {
    const handleMoveX = (deltaX: number) => {
      const x = imageRef.current?.x() || 0;

      imageRef.current?.x(x + deltaX);
      setDimension((prev) => ({ ...prev, x: x + deltaX }));
    };
    const handleMoveY = (deltaY: number) => {
      const y = imageRef.current?.y() || 0;

      imageRef.current?.y(y + deltaY);
      setDimension((prev) => ({ ...prev, y: y + deltaY }));
    };

    const unregisters = [
      shortcuts.on(['ArrowLeft'], () => handleMoveX(-step)),
      shortcuts.on(['ArrowRight'], () => handleMoveX(step)),
      shortcuts.on(['ArrowUp'], () => handleMoveY(-step)),
      shortcuts.on(['ArrowDown'], () => handleMoveY(step)),
    ];

    return () => unregisters.forEach((unregister) => unregister());
  }, [step, imageRef, setDimension]);

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t.position_artwork}:</div>
      <ol className={styles.steps}>
        <li>{t.position_step1}</li>
        <li>{t.position_step2}</li>
      </ol>
      <div className={styles.controls}>
        <Flex align="center" justify="space-between">
          <div>{t.offset_x}:</div>
          <UnitInput
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            isInch={isInch}
            onChange={(val) => {
              if (val === null) return;

              const targetCenterX = val * dpmm + initialCenter.x;
              const targetX = targetCenterX - (width / 2) * Math.cos(rad) + (height / 2) * Math.sin(rad);

              imageRef.current?.x(targetX);
              setDimension((prev) => ({ ...prev, x: targetX }));
            }}
            precision={isInch ? 4 : 2}
            size="small"
            step={step}
            value={(centerX - initialCenter.x) / dpmm}
          />
        </Flex>
        <Flex align="center" justify="space-between">
          <div>{t.offset_y}:</div>
          <UnitInput
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            isInch={isInch}
            onChange={(val) => {
              if (val === null) return;

              const targetCenterY = val * dpmm + initialCenter.y;
              const targetY = targetCenterY - (width / 2) * Math.sin(rad) - (height / 2) * Math.cos(rad);

              imageRef.current?.y(targetY);
              setDimension((prev) => ({ ...prev, y: targetY }));
            }}
            precision={isInch ? 4 : 2}
            size="small"
            step={step}
            value={(centerY - initialCenter.y) / dpmm}
          />
        </Flex>
        <Flex align="center" justify="space-between">
          <div>{t.rotation}:</div>
          <UnitInput
            addonAfter="deg"
            className={styles.input}
            onChange={(val) => {
              if (val === null) return;

              const newRad = (val * Math.PI) / 180;
              const newX = centerX - (width / 2) * Math.cos(newRad) + (height / 2) * Math.sin(newRad);
              const newY = centerY - (width / 2) * Math.sin(newRad) - (height / 2) * Math.cos(newRad);

              imageRef.current?.rotation(val);
              imageRef.current?.x(newX);
              imageRef.current?.y(newY);
              setDimension((prev) => ({ ...prev, rotation: val, x: newX, y: newY }));
            }}
            precision={0}
            size="small"
            value={dimension.rotation}
          />
        </Flex>
      </div>
      <Button className={styles.reset} onClick={handleResetPosition}>
        {t.reset_position}
      </Button>
      <div className={styles.info}>
        <div>
          {t.artwork_size}: {getSizeStr(width, height)}
        </div>
        <div>
          {t.pattern_size}: {getSizeStr(contour.bbox[2], contour.bbox[3])}
        </div>
      </div>
    </div>
  );
};

export default Controls;
