import Konva from 'konva';
import React, {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Button, Flex } from 'antd';

import constant from 'app/actions/beambox/constant';
import round from 'helpers/math/round';
import shortcuts from 'helpers/shortcuts';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { AutoFitContour } from 'interfaces/IAutoFit';

import styles from './Controls.module.scss';
import { calculateDimensionCenter, ImageDimension } from './dimension';

interface Props {
  imageRef: MutableRefObject<Konva.Image>;
  contour: AutoFitContour;
  initDimension: ImageDimension;
  dimension: ImageDimension;
  setDimension: Dispatch<SetStateAction<ImageDimension>>;
}

const Controls = ({
  imageRef,
  contour,
  initDimension,
  dimension,
  setDimension,
}: Props): JSX.Element => {
  const { auto_fit: t } = useI18n();
  const { dpmm } = constant;
  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const initialCenter = useMemo(() => calculateDimensionCenter(initDimension), [initDimension]);

  const handleResetPosition = useCallback(() => {
    if (imageRef.current) {
      const { x, y, width, height, rotation } = initDimension;
      const image = imageRef.current;
      image.position({ x, y });
      image.width(width);
      image.height(height);
      image.rotation(rotation);
      setDimension({ ...initDimension });
    }
  }, [imageRef, initDimension, setDimension]);

  const { width, height, rotation } = dimension;
  const rad = (rotation * Math.PI) / 180;
  const { x: centerX, y: centerY } = useMemo(
    () => calculateDimensionCenter(dimension),
    [dimension]
  );
  const getSizeStr = useCallback(
    (w: number, h: number) => {
      const getDisplayValue = (val: number) => round(val / dpmm / (isInch ? 25.4 : 1), 2);
      return `${getDisplayValue(w)} x ${getDisplayValue(h)} ${isInch ? 'in' : 'mm'}`;
    },
    [dpmm, isInch]
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
        <Flex justify="space-between" align="center">
          <div>{t.offset_x}:</div>
          <UnitInput
            className={styles.input}
            size="small"
            isInch={isInch}
            value={(centerX - initialCenter.x) / dpmm}
            onChange={(val) => {
              const targetCenterX = val * dpmm + initialCenter.x;
              const targetX =
                targetCenterX - (width / 2) * Math.cos(rad) + (height / 2) * Math.sin(rad);
              imageRef.current?.x(targetX);
              setDimension((prev) => ({ ...prev, x: targetX }));
            }}
            step={step}
            addonAfter={isInch ? 'in' : 'mm'}
            precision={isInch ? 4 : 2}
          />
        </Flex>
        <Flex justify="space-between" align="center">
          <div>{t.offset_y}:</div>
          <UnitInput
            className={styles.input}
            size="small"
            isInch={isInch}
            value={(centerY - initialCenter.y) / dpmm}
            onChange={(val) => {
              const targetCenterY = val * dpmm + initialCenter.y;
              const targetY =
                targetCenterY - (width / 2) * Math.sin(rad) - (height / 2) * Math.cos(rad);
              imageRef.current?.y(targetY);
              setDimension((prev) => ({ ...prev, y: targetY }));
            }}
            step={step}
            addonAfter={isInch ? 'in' : 'mm'}
            precision={isInch ? 4 : 2}
          />
        </Flex>
        <Flex justify="space-between" align="center">
          <div>{t.rotation}:</div>
          <UnitInput
            className={styles.input}
            size="small"
            value={dimension.rotation}
            onChange={(val) => {
              const newRad = (val * Math.PI) / 180;
              const newX =
                centerX - (width / 2) * Math.cos(newRad) + (height / 2) * Math.sin(newRad);
              const newY =
                centerY - (width / 2) * Math.sin(newRad) - (height / 2) * Math.cos(newRad);
              imageRef.current?.rotation(val);
              imageRef.current?.x(newX);
              imageRef.current?.y(newY);
              setDimension((prev) => ({ ...prev, rotation: val, x: newX, y: newY }));
            }}
            addonAfter="deg"
            precision={0}
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
