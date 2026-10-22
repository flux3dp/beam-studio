import React, { useMemo } from 'react';

import { AimOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Tooltip } from 'antd';
import { Quaternion, Vector3 } from 'three';
import { useShallow } from 'zustand/react/shallow';

import { AXIS_COLORS } from '@core/app/components/beambox/InnerEngraving/constants';
import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import type { GroupDelta } from '@core/app/components/beambox/InnerEngraving/utils/groupTransform';
import { applyGroupTransform, getGroupBox } from '@core/app/components/beambox/InnerEngraving/utils/groupTransform';
import { useViewStore } from '@core/app/components/beambox/InnerEngraving/viewStore';
import { iconButtonTheme } from '@core/app/constants/antd-config';
import { useStlStore } from '@core/app/stores/stlStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './DimensionPanelStl.module.scss';
import StlAdjustInput from './StlAdjustInput';

const AXES = [0, 1, 2] as const;
const AXIS_LABELS = ['X', 'Y', 'Z'] as const;
const AXIS_VECTORS = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
const DEG_TO_RAD = Math.PI / 180;
/** A size of exactly 0 cannot be turned back into a factor, and the selection would vanish. */
const MIN_SIZE = 0.01;

interface Props {
  ids: string[];
}

/**
 * The dimension panel for several STL objects, edited as one body.
 *
 * Position and size are those of the selection's union box, and every edit is applied to all the
 * objects about its centre (`applyGroupTransform`), in one undo step:
 * - size is always proportional: a per-axis factor on a rotated object would need a shear
 * - there is no common absolute rotation, so rotation only takes relative turns, like the gizmo
 * - flipping mirrors the selection across the plane through its centre
 * - no reset: each object has its own import transform, and the selection as a whole never had one
 */
const DimensionPanelStlMulti = ({ ids }: Props): null | React.JSX.Element => {
  const { inner_engraving_settings: t } = useI18n();
  const objects = useStlStore(useShallow((state) => ids.map((id) => state.objects[id]).filter(Boolean)));
  const setTransformMode = useViewStore((state) => state.setTransformMode);
  const transformMode = useViewStore((state) => state.transformMode);
  const isInch = useStorageStore((state) => state.isInch);
  const box = useMemo(() => getGroupBox(objects), [objects]);

  if (objects.length === 0) return null;

  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const apply = (delta: GroupDelta) => applyGroupTransform(objects, delta, center);
  const toMm = (value: number) => (isInch ? value * 25.4 : value);

  const changePosition = (axis: number, mm: number) => {
    const translation = new Vector3();

    translation.setComponent(axis, mm * MM_TO_SCENE - center.getComponent(axis));
    apply({ translation });
  };

  const changeSize = (axis: number, mm: number) => {
    const current = size.getComponent(axis);

    if (current <= 0) return;

    apply({ scale: (Math.max(mm, MIN_SIZE) * MM_TO_SCENE) / current });
  };

  const adjustPosition = (axis: number, delta: number) =>
    changePosition(axis, center.getComponent(axis) / MM_TO_SCENE + toMm(delta));

  const adjustSize = (_: number, percent: number) => {
    if (percent > 0) apply({ scale: percent / 100 });
  };

  const adjustRotation = (axis: number, deg: number) =>
    apply({ rotation: new Quaternion().setFromAxisAngle(AXIS_VECTORS[axis], deg * DEG_TO_RAD) });

  const renderTransformMode = (mode: typeof transformMode, title: string) => (
    <Tooltip title={title}>
      <Button
        aria-label={title}
        className={styles.actionButton}
        color={transformMode === mode ? 'blue' : 'default'}
        icon={<AimOutlined />}
        id={`stl-transform-${mode}`}
        onClick={() => setTransformMode(mode)}
        size="small"
        variant="text"
      />
    </Tooltip>
  );

  const renderAxisInputs = (
    idPrefix: string,
    values: Array<number | undefined>,
    adjust: (axis: number, value: number) => void,
    {
      adjustPlaceholder,
      adjustPrecision,
      disabledAxes = [],
      onChange,
      precision,
      unit,
      useInch,
    }: {
      adjustPlaceholder: string;
      adjustPrecision?: number;
      disabledAxes?: number[];
      /** Absent when the field only shows nothing: rotation has no common value to edit. */
      onChange?: (axis: number, value: number) => void;
      precision: number;
      unit: string;
      useInch?: boolean;
    },
  ) => (
    <div className={styles.axes}>
      {AXES.map((axis) => {
        const inputId = `${idPrefix}-${AXIS_LABELS[axis].toLowerCase()}`;

        return (
          <React.Fragment key={axis}>
            <label className={styles.axis} htmlFor={inputId} style={{ color: AXIS_COLORS[axis] }}>
              {AXIS_LABELS[axis]}
            </label>
            <UnitInput
              addonAfter={unit}
              containerClassName={styles.field}
              disabled={!onChange || disabledAxes.includes(axis)}
              id={inputId}
              isInch={useInch}
              onChange={(value) => {
                if (typeof value === 'number') onChange?.(axis, value);
              }}
              precision={precision}
              size="small"
              value={values[axis]}
            />
            <StlAdjustInput
              className={styles.field}
              disabled={disabledAxes.includes(axis)}
              id={`${inputId}-adjust`}
              onCommit={(value) => adjust(axis, value)}
              placeholder={adjustPlaceholder}
              precision={adjustPrecision ?? precision}
              title={t.adjust_hint}
            />
          </React.Fragment>
        );
      })}
    </div>
  );

  const lengthUnit = isInch ? 'in' : 'mm';
  const lengthPrecision = isInch ? 4 : 2;
  // a selection of photo planes only is flat: its height cannot be scaled to anything
  const flatAxes = AXES.filter((axis) => size.getComponent(axis) <= 0);

  const renderSection = (title: string, content: React.ReactNode, actions?: React.ReactNode) => (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.actions}>{actions}</div>
      </div>
      {content}
    </div>
  );

  return (
    <div className={styles.panel}>
      <ConfigProvider theme={iconButtonTheme}>
        {renderSection(
          t.position,
          renderAxisInputs(
            'stl-position',
            center.toArray().map((value) => value / MM_TO_SCENE),
            adjustPosition,
            {
              adjustPlaceholder: '±',
              onChange: changePosition,
              precision: lengthPrecision,
              unit: lengthUnit,
              useInch: isInch,
            },
          ),
          renderTransformMode('translate', t.position),
        )}
        {renderSection(
          t.size,
          renderAxisInputs(
            'stl-size',
            size.toArray().map((value) => value / MM_TO_SCENE),
            adjustSize,
            {
              // a percentage, not a length: it is never converted to inches
              adjustPlaceholder: '%',
              adjustPrecision: 2,
              disabledAxes: flatAxes,
              onChange: changeSize,
              precision: lengthPrecision,
              unit: lengthUnit,
              useInch: isInch,
            },
          ),
          renderTransformMode('scale', t.size),
        )}
        {renderSection(
          t.rotation,
          renderAxisInputs('stl-rotation', [undefined, undefined, undefined], adjustRotation, {
            adjustPlaceholder: '±',
            precision: 2,
            unit: '°',
          }),
          renderTransformMode('rotate', t.rotation),
        )}
        {renderSection(
          t.flip,
          <div className={styles.flips}>
            {AXES.map((axis) => (
              <Button
                id={`stl-flip-${AXIS_LABELS[axis].toLowerCase()}`}
                key={axis}
                onClick={() => apply({ mirrorAxis: axis })}
                size="small"
                style={{ color: AXIS_COLORS[axis] }}
              >
                {AXIS_LABELS[axis]}
              </Button>
            ))}
          </div>,
        )}
      </ConfigProvider>
    </div>
  );
};

export default DimensionPanelStlMulti;
