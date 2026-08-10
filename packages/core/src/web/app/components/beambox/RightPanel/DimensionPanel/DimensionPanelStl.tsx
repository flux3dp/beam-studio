import React, { useMemo } from 'react';

import { UndoOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Tooltip } from 'antd';

import { AXIS_COLORS } from '@core/app/components/beambox/InnerEngraving/constants';
import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { getBaseSize, setTransform } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import { useViewStore } from '@core/app/components/beambox/InnerEngraving/viewStore';
import { iconButtonTheme } from '@core/app/constants/antd-config';
import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import type { StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './DimensionPanelStl.module.scss';
import StlAdjustInput from './StlAdjustInput';

const AXES = [0, 1, 2] as const;
const AXIS_LABELS = ['X', 'Y', 'Z'] as const;
const RAD_TO_DEG = 180 / Math.PI;
/** A size of exactly 0 cannot be turned back into a scale, and the object would vanish. */
const MIN_SIZE = 0.01;

interface AxisInputOpts {
  addonAfter?: string;
  /** What the narrow field to the right does with the number typed into it. */
  adjust: (axis: number, value: number) => void;
  /** Shown in the adjust field: how the typed number is combined with the current one. */
  adjustPlaceholder: string;
  /** Defaults to the value field's precision; a percentage does not want inch precision. */
  adjustPrecision?: number;
  /** Only for lengths. Angles and percentages are unitless and must not be converted. */
  isInch?: boolean;
  precision: number;
}

interface Props {
  id: string;
}

/**
 * The dimension panel for an STL object.
 *
 * Separate from the 2D `DimensionPanel` because the two edit different things: the 2D panel writes
 * the element's own x/y/width/height, but for an STL object those belong to the **projection rect**,
 * which is derived — writing to it would be thrown away by the next re-projection. Everything here
 * edits the 3D transform and lets the rect follow.
 *
 * Axes are the 3D canvas's (X right, Y away from the camera, Z up) and position is the object's
 * **centre**, so scaling and rotating leave it where it is.
 */
const DimensionPanelStl = ({ id }: Props): null | React.JSX.Element => {
  const {
    beambox: {
      right_panel: { object_panel: tObject },
    },
    inner_engraving_settings: t,
  } = useI18n();
  const object = useStlStore((state) => state.objects[id]);
  const { ratioLocked, setRatioLocked } = useViewStore();
  const isInch = useStorageStore((state) => state.isInch);
  const baseSize = useMemo(() => (object ? getBaseSize(object.geometry) : null), [object]);

  if (!object || !baseSize) return null;

  const { flip, position, rotation, scale } = object.transform;
  const apply = (next: Partial<StlTransform>) => setTransform(object, { ...object.transform, ...next });

  const changePosition = (axis: number, mm: number) => {
    const next = [...position] as [number, number, number];

    next[axis] = mm * MM_TO_SCENE;
    apply({ position: next });
  };

  const changeSize = (axis: number, mm: number) => {
    const base = baseSize.getComponent(axis);

    if (base <= 0) return;

    const nextScale = Math.max(mm, MIN_SIZE) / base;

    if (ratioLocked) {
      // the ratio is kept by applying the same factor to all three, not by copying the scale:
      // a non-uniform object has to stay non-uniform
      const factor = nextScale / scale[axis];

      apply({ scale: [scale[0] * factor, scale[1] * factor, scale[2] * factor] });
    } else {
      const next = [...scale] as [number, number, number];

      next[axis] = nextScale;
      apply({ scale: next });
    }
  };

  const changeRotation = (axis: number, deg: number) => {
    const next = [...rotation] as [number, number, number];

    next[axis] = deg / RAD_TO_DEG;
    apply({ rotation: next });
  };

  // "adjust from the current value": the panel's inputs are absolute, these are relative. Lengths
  // and angles add, size multiplies by a percentage — 120 means 1.2x, which is how the PM's example
  // ("scale x * 1.2") reads on a size field.
  // The adjust field is a plain number input, so an inch document hands lengths over in inches.
  const toMm = (value: number) => (isInch ? value * 25.4 : value);

  const adjustPosition = (axis: number, delta: number) =>
    changePosition(axis, position[axis] / MM_TO_SCENE + toMm(delta));

  const adjustRotation = (axis: number, delta: number) => changeRotation(axis, rotation[axis] * RAD_TO_DEG + delta);

  const adjustSize = (axis: number, percent: number) => {
    if (percent <= 0) return;

    changeSize(axis, baseSize.getComponent(axis) * scale[axis] * (percent / 100));
  };

  const toggleFlip = (axis: number) => {
    const next = [...flip] as [boolean, boolean, boolean];

    next[axis] = !next[axis];
    apply({ flip: next });
  };

  // back to where the object came in, like the other two resets. Import already centres on the
  // engravable area, so this is that centre as it was at import — deliberately not recomputed: a
  // reset that moved the object somewhere it has never been would not read as a reset
  const resetPosition = () => apply({ position: [...object.initialTransform.position] });

  const renderReset = (buttonId: string, onClick: () => void) => (
    <Tooltip title={t.reset}>
      <Button icon={<UndoOutlined />} id={buttonId} onClick={onClick} size="small" type="text" />
    </Tooltip>
  );

  const renderAxisInputs = (
    idPrefix: string,
    values: number[],
    onChange: (axis: number, value: number) => void,
    { addonAfter, adjust, adjustPlaceholder, adjustPrecision, isInch: useInch, precision }: AxisInputOpts,
  ) => (
    <div className={styles.axes}>
      {AXES.map((axis) => {
        const inputId = `${idPrefix}-${AXIS_LABELS[axis].toLowerCase()}`;

        return (
          <React.Fragment key={axis}>
            {/* coloured like three.js's axes, so the label names the arrow on the canvas */}
            <label className={styles.axis} htmlFor={inputId} style={{ color: AXIS_COLORS[axis] }}>
              {AXIS_LABELS[axis]}
            </label>
            <UnitInput
              addonAfter={addonAfter}
              containerClassName={styles.field}
              id={inputId}
              isInch={useInch}
              onChange={(value) => {
                if (typeof value === 'number') onChange(axis, value);
              }}
              precision={precision}
              size="small"
              value={values[axis]}
            />
            <StlAdjustInput
              className={styles.field}
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
            position.map((value) => value / MM_TO_SCENE),
            changePosition,
            {
              addonAfter: lengthUnit,
              adjust: adjustPosition,
              adjustPlaceholder: '±',
              isInch,
              precision: lengthPrecision,
            },
          ),
          renderReset('stl-position-reset', resetPosition),
        )}
        {renderSection(
          t.size,
          renderAxisInputs(
            'stl-size',
            AXES.map((axis) => baseSize.getComponent(axis) * scale[axis]),
            changeSize,
            {
              addonAfter: lengthUnit,
              adjust: adjustSize,
              // a percentage, not a length: it is never converted to inches
              adjustPlaceholder: '%',
              adjustPrecision: 2,
              isInch,
              precision: lengthPrecision,
            },
          ),
          <>
            {/* the lock is a tool mode, not a property of this object: it also constrains the scale
                gizmo on the canvas */}
            <Tooltip title={ratioLocked ? tObject.unlock_aspect : tObject.lock_aspect}>
              <Button
                icon={ratioLocked ? <DimensionPanelIcons.Locked /> : <DimensionPanelIcons.Unlocked />}
                id="stl-ratio-lock"
                onClick={() => setRatioLocked(!ratioLocked)}
                size="small"
                type="text"
              />
            </Tooltip>
            {/* back to the size the object was imported at, which is not the STL file's own size
                when import had to shrink it to fit the engravable area */}
            {renderReset('stl-size-reset', () => apply({ scale: [...object.initialTransform.scale] }))}
          </>,
        )}
        {renderSection(
          `${t.rotation} (${t.euler_order})`,
          renderAxisInputs(
            'stl-rotation',
            rotation.map((value) => value * RAD_TO_DEG),
            changeRotation,
            { addonAfter: '°', adjust: adjustRotation, adjustPlaceholder: '±', precision: 2 },
          ),
          renderReset('stl-rotation-reset', () => apply({ rotation: [...object.initialTransform.rotation] })),
        )}
        {renderSection(
          t.flip,
          <div className={styles.flips}>
            {AXES.map((axis) => (
              <Button
                id={`stl-flip-${AXIS_LABELS[axis].toLowerCase()}`}
                key={axis}
                onClick={() => toggleFlip(axis)}
                size="small"
                style={flip[axis] ? undefined : { color: AXIS_COLORS[axis] }}
                type={flip[axis] ? 'primary' : 'default'}
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

export default DimensionPanelStl;
