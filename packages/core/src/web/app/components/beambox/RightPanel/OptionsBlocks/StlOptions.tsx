import React, { useEffect, useState } from 'react';

import { Segmented } from 'antd';

import type { EngravingMode } from '@core/app/constants/innerEngraving';
import { LAYER_HEIGHT_LIMIT, POINT_SPACING_LIMIT } from '@core/app/constants/innerEngraving';
import { useStorageStore } from '@core/app/stores/storageStore';
import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import { getStlEngravingParams, setStlEngravingParam } from '@core/app/svgedit/stl/engravingParams';
import UnitInput from '@core/app/widgets/UnitInput';
import { todo } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import InFillBlock from './InFillBlock';
import styles from './StlOptions.module.scss';

todo('mobile 版還沒處理，其他 OptionsBlocks 都有 ObjectPanelItem 的分支');

interface Props {
  elem: Element;
}

/**
 * Engraving options for an STL object: what the slicer does with the layers it produces.
 *
 * The values live on the projection rect as attributes, not in the STL store, because they are read
 * by the **backend** from the svg string (see `svgedit/stl/engravingParams.ts`). This component only
 * mirrors them into local state so the inputs stay responsive.
 */
const StlOptions = ({ elem }: Props): React.JSX.Element => {
  const { inner_engraving_settings: t } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const [params, setParams] = useState(() => getStlEngravingParams(elem));

  // the selection can change without this component unmounting, and undo can change the attributes
  // underneath us
  useEffect(() => {
    setParams(getStlEngravingParams(elem));
  }, [elem]);

  const update = (attr: string, value: number | string) => {
    setStlEngravingParam(elem, attr, value);
    setParams(getStlEngravingParams(elem));
  };

  const renderRow = (label: string, control: React.ReactNode, key: string) => (
    <div className={styles.row} key={key}>
      <div className={styles.label} title={label}>
        {label}
      </div>
      <div className={styles.control}>{control}</div>
    </div>
  );

  const renderLengthInput = (id: string, value: number, attr: string, limit: { max: number; min: number }) => (
    <UnitInput
      addonAfter={isInch ? 'in' : 'mm'}
      containerClassName={styles.input}
      id={id}
      isInch={isInch}
      max={limit.max}
      min={limit.min}
      onChange={(next) => {
        if (typeof next === 'number') update(attr, next);
      }}
      precision={isInch ? 5 : 3}
      size="small"
      value={value}
    />
  );

  return (
    <div className={styles.block}>
      {renderRow(
        t.engraving_mode,
        <Segmented
          className={styles.segmented}
          onChange={(value: EngravingMode) => update(STL_ATTR.mode, value)}
          options={[
            { label: t.mode_line, value: 'line' },
            { label: t.mode_dot, value: 'dot' },
          ]}
          size="small"
          value={params.mode}
        />,
        'mode',
      )}
      {/* infill is the projection rect's own fill, so it reuses the block every 2D shape uses
          rather than inventing a second fill concept for STL objects */}
      <InFillBlock elems={[elem]} id="stl-fill" key="fill" label={t.fill} />
      {renderRow(
        t.layer_height,
        renderLengthInput('stl-layer-height', params.layerHeight, STL_ATTR.layerHeight, LAYER_HEIGHT_LIMIT),
        'layer-height',
      )}
      {/* only dot mode samples the contour into points, so the spacing means nothing in line mode */}
      {params.mode === 'dot' &&
        renderRow(
          t.point_spacing,
          renderLengthInput('stl-point-spacing', params.pointSpacing, STL_ATTR.pointSpacing, POINT_SPACING_LIMIT),
          'point-spacing',
        )}
    </div>
  );
};

export default StlOptions;
