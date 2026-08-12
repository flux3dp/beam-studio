import React, { useMemo, useState } from 'react';

import { Alert, Button, Segmented } from 'antd';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { MaterialShape } from '@core/app/constants/innerEngraving';
import {
  FOCAL_LENGTH_LIMIT,
  MATERIAL_POSITION_LIMIT,
  MATERIAL_SIZE_LIMIT,
  REFRACTIVE_INDEX_LIMIT,
  SAFETY_MARGIN_LIMIT,
} from '@core/app/constants/innerEngraving';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import isDev from '@core/helpers/is-dev';
import round from '@core/helpers/math/round';
import useI18n from '@core/helpers/useI18n';
import type { DocumentState } from '@core/interfaces/Preference';

import styles from './InnerEngravingSettings.module.scss';

/** Which point of the material the position inputs refer to. The stored value is always the centre. */
type Anchor = 'center' | 'corner';

interface Props {
  onClose: () => void;
  /** The work area being edited, which may differ from the saved one while DocumentSettings is open. */
  workarea?: WorkAreaModel;
}

/**
 * The inner engraving material: shape, size, position and refractive index (TODO.md 第 3 點).
 *
 * Saves straight into the document store, the same way RotarySettings does, so the material can be
 * adjusted from the canvas without going through DocumentSettings.
 */
const InnerEngravingSettings = ({ onClose, workarea }: Props): React.JSX.Element => {
  const { global: tGlobal, inner_engraving_settings: t } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const model = useMemo(() => workarea ?? useDocumentStore.getState().workarea, [workarea]);
  // the machine's Z travel bounds the material, so the limit follows the model rather than the input
  const maxHeight = useMemo(() => getWorkarea(model).innerEngraving?.maxMaterialHeight ?? 300, [model]);
  const workareaSize = useMemo(() => {
    const { height: modelHeight, width: modelWidth } = getWorkarea(model);
    const customized = useDocumentStore.getState()['customized-dimension'][model];

    return { height: customized?.height ?? modelHeight, width: customized?.width ?? modelWidth };
  }, [model]);

  const initial = useDocumentStore.getState();
  /** Which point of the material the X/Y inputs refer to. A view setting, so it is not persisted. */
  const [anchor, setAnchor] = useState<Anchor>('center');
  const [shape, setShape] = useState<MaterialShape>(initial['inner-engraving-shape']);
  const [width, setWidth] = useState(initial['inner-engraving-width']);
  const [depth, setDepth] = useState(initial['inner-engraving-depth']);
  const [height, setHeight] = useState(initial['inner-engraving-height']);
  const [diameter, setDiameter] = useState(initial['inner-engraving-diameter']);
  const [x, setX] = useState(initial['inner-engraving-x']);
  const [y, setY] = useState(initial['inner-engraving-y']);
  const [refractiveIndex, setRefractiveIndex] = useState(initial['inner-engraving-refractive-index']);
  const [focalLength, setFocalLength] = useState(initial['inner-engraving-focal-length']);
  const [safetyMargin, setSafetyMargin] = useState(initial['inner-engraving-safety-margin']);

  const isRound = shape !== 'box';
  // a sphere is filled with liquid of the same refractive index up to the height, so it can never
  // be taller than the ball itself
  const heightMax = shape === 'sphere' ? Math.min(diameter, maxHeight) : maxHeight;
  // the XY footprint, which is what turns a centre into a corner and back
  const footprint = isRound ? { depth: diameter, width: diameter } : { depth, width };

  const toAnchor = (center: number, size: number) => (anchor === 'center' ? center : center - size / 2);
  const toCenter = (value: number, size: number) => (anchor === 'center' ? value : value + size / 2);
  const lengthText = (mm: number) => `${round(isInch ? mm / 25.4 : mm, isInch ? 4 : 2)}${isInch ? 'in' : 'mm'}`;

  const centerOnWorkarea = () => {
    setX(workareaSize.width / 2);
    setY(workareaSize.height / 2);
  };

  const handleSave = () => {
    const newState: Partial<DocumentState> = {
      'inner-engraving-focal-length': focalLength,
      'inner-engraving-refractive-index': refractiveIndex,
      'inner-engraving-safety-margin': safetyMargin,
      'inner-engraving-shape': shape,
      'inner-engraving-x': x,
      'inner-engraving-y': y,
    };

    // only write the fields the chosen shape actually uses, so switching shape and back keeps the
    // other shape's dimensions
    if (isRound) {
      newState['inner-engraving-diameter'] = diameter;
    } else {
      newState['inner-engraving-width'] = width;
      newState['inner-engraving-depth'] = depth;
    }

    newState['inner-engraving-height'] = Math.min(height, heightMax);

    useDocumentStore.getState().update(newState);
  };

  const lengthInput = (
    id: string,
    value: number,
    onChange: (value: number) => void,
    { max = MATERIAL_SIZE_LIMIT.max, min = MATERIAL_SIZE_LIMIT.min }: { max?: number; min?: number } = {},
  ) => (
    <UnitInput
      addonAfter={isInch ? 'in' : 'mm'}
      className={styles.input}
      id={id}
      isInch={isInch}
      max={max}
      min={min}
      onChange={(val) => {
        if (typeof val === 'number') onChange(val);
      }}
      precision={isInch ? 4 : 2}
      value={value}
    />
  );

  return (
    <DraggableModal
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={() => {
        handleSave();
        onClose();
      }}
      open
      title={t.title}
    >
      <div className={styles.container}>
        <div className={styles.table}>
          <div>
            <label htmlFor="material_shape">{t.material_shape}</label>
          </div>
          <div>
            <Segmented
              id="material_shape"
              onChange={(val: MaterialShape) => setShape(val)}
              options={[
                { label: t.shape_box, value: 'box' },
                { label: t.shape_cylinder, value: 'cylinder' },
                { label: t.shape_sphere, value: 'sphere' },
              ]}
              value={shape}
            />
          </div>

          <div className={styles.row}>
            <strong>{t.material_size}</strong>
          </div>
          {isRound ? (
            <>
              <div>
                <label htmlFor="diameter">{t.diameter}</label>
              </div>
              <div>{lengthInput('diameter', diameter, setDiameter)}</div>
              <div>
                <label htmlFor="circumference">{t.circumference}</label>
              </div>
              <div>
                {/* mirrors RotarySettings: the two inputs are two views of the same value */}
                <UnitInput
                  addonAfter={isInch ? 'in' : 'mm'}
                  className={styles.input}
                  id="circumference"
                  isInch={isInch}
                  max={MATERIAL_SIZE_LIMIT.max * Math.PI}
                  min={MATERIAL_SIZE_LIMIT.min * Math.PI}
                  onChange={(val) => {
                    if (typeof val === 'number') setDiameter(val / Math.PI);
                  }}
                  precision={isInch ? 6 : 4}
                  value={diameter * Math.PI}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="width">{t.width}</label>
              </div>
              <div>{lengthInput('width', width, setWidth)}</div>
              <div>
                <label htmlFor="depth">{t.depth}</label>
              </div>
              <div>{lengthInput('depth', depth, setDepth)}</div>
            </>
          )}
          <div>
            <label htmlFor="height">{t.height}</label>
          </div>
          <div>{lengthInput('height', Math.min(height, heightMax), setHeight, { max: heightMax })}</div>

          <div className={styles.row}>
            <strong>{t.material_position}</strong>
          </div>
          <div>
            <label htmlFor="position_anchor">{t.anchor}</label>
          </div>
          <div>
            {/* which point of the material the X/Y below refer to. The stored value is always the
                centre; the corner is only another way to type the same position */}
            <Segmented
              id="position_anchor"
              onChange={(val: Anchor) => setAnchor(val)}
              options={[
                { label: t.center, value: 'center' },
                { label: t.bottom_left, value: 'corner' },
              ]}
              value={anchor}
            />
          </div>
          <div>
            <label htmlFor="material_x">X</label>
          </div>
          <div>
            {lengthInput('material_x', toAnchor(x, footprint.width), (val) => setX(toCenter(val, footprint.width)), {
              max: MATERIAL_POSITION_LIMIT.max,
              min: MATERIAL_POSITION_LIMIT.min,
            })}
          </div>
          <div>
            <label htmlFor="material_y">Y</label>
          </div>
          <div>
            {lengthInput('material_y', toAnchor(y, footprint.depth), (val) => setY(toCenter(val, footprint.depth)), {
              max: MATERIAL_POSITION_LIMIT.max,
              min: MATERIAL_POSITION_LIMIT.min,
            })}
          </div>
          <div className={styles.row}>
            {/* both readings at once, so switching the anchor is never needed just to read a number */}
            <div className={styles.hint}>
              <div>{`${t.range}: X ${lengthText(x - footprint.width / 2)} ~ ${lengthText(x + footprint.width / 2)}, Y ${lengthText(y - footprint.depth / 2)} ~ ${lengthText(y + footprint.depth / 2)}`}</div>
              <div>{`${t.center}: ${lengthText(x)}, ${lengthText(y)}`}</div>
            </div>
            <Button onClick={centerOnWorkarea} size="small" type="link">
              {t.center_on_workarea}
            </Button>
          </div>

          {/* dev only for now: the 4mm default comes from xTool and still needs verifying on real
              hardware, so it is not something users should be tuning yet (TODO.md 08/06 with PM) */}
          {isDev() && (
            <>
              <div>
                <label htmlFor="safety_margin">{t.safety_margin}</label>
              </div>
              <div>
                {lengthInput('safety_margin', safetyMargin, setSafetyMargin, {
                  max: SAFETY_MARGIN_LIMIT.max,
                  min: SAFETY_MARGIN_LIMIT.min,
                })}
              </div>
            </>
          )}

          <div>
            <label htmlFor="refractive_index">{t.refractive_index}</label>
          </div>
          <div>
            {/* unitless: no isInch, or the value would be converted like a length */}
            <UnitInput
              className={styles.input}
              id="refractive_index"
              max={REFRACTIVE_INDEX_LIMIT.max}
              min={REFRACTIVE_INDEX_LIMIT.min}
              onChange={(val) => {
                if (typeof val === 'number') setRefractiveIndex(val);
              }}
              precision={REFRACTIVE_INDEX_LIMIT.precision}
              step={0.01}
              value={refractiveIndex}
            />
          </div>

          {/* the lens, not the job — but swiftray's machine settings have no field for it, so it
              rides along with the material settings that feed the same refraction compensation */}
          <div>
            <label htmlFor="focal_length">{t.focal_length}</label>
          </div>
          <div>
            {lengthInput('focal_length', focalLength, setFocalLength, {
              max: FOCAL_LENGTH_LIMIT.max,
              min: FOCAL_LENGTH_LIMIT.min,
            })}
          </div>
          <div className={styles.row}>
            <div className={styles.hint}>{t.focal_length_hint}</div>
          </div>
        </div>
        {/* the machine cannot read its Z position, so a wrong focus ruins the whole workpiece */}
        <Alert className={styles.reminder} message={t.focus_reminder} showIcon type="warning" />
      </div>
    </DraggableModal>
  );
};

export default InnerEngravingSettings;

export const showInnerEngravingSettings = (workarea?: WorkAreaModel): void => {
  if (!isIdExist('inner-engraving-settings')) {
    addDialogComponent(
      'inner-engraving-settings',
      <InnerEngravingSettings onClose={() => popDialogById('inner-engraving-settings')} workarea={workarea} />,
    );
  }
};
