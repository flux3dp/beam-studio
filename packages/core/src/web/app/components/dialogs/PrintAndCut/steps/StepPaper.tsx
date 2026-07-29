import React, { useMemo } from 'react';

import { Alert, InputNumber, Radio } from 'antd';
import { sprintf } from 'sprintf-js';
import { useShallow } from 'zustand/react/shallow';

import { dpmm } from '@core/app/actions/beambox/constant';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import type { PaperSelection } from '../constants';
import { paperSizes, PRINT_MARGIN_MM } from '../constants';
import styles from '../index.module.scss';
import { getContentBBoxFromState, getPaperDimensionsMm, usePrintAndCutStore } from '../store';

const StepPaper = (): React.JSX.Element => {
  const lang = useI18n().print_and_cut;
  const {
    designBBox,
    gridColumns,
    gridGapMm,
    gridRows,
    markPositions,
    orientation,
    paperKey,
    setGrid,
    setOrientation,
    setPaperKey,
  } = usePrintAndCutStore(
    useShallow(
      ({
        designBBox,
        gridColumns,
        gridGapMm,
        gridRows,
        markPositions,
        orientation,
        paperKey,
        setGrid,
        setOrientation,
        setPaperKey,
      }) => ({
        designBBox,
        gridColumns,
        gridGapMm,
        gridRows,
        markPositions,
        orientation,
        paperKey,
        setGrid,
        setOrientation,
        setPaperKey,
      }),
    ),
  );

  const isPaperTooSmall = useMemo(() => {
    const contentBBox = getContentBBoxFromState({ designBBox, markPositions });

    if (!contentBBox) return false;

    const { heightMm, widthMm } = getPaperDimensionsMm({ designBBox, markPositions, orientation, paperKey });
    const margin = 2 * PRINT_MARGIN_MM;

    return contentBBox.width / dpmm + margin > widthMm || contentBBox.height / dpmm + margin > heightMm;
  }, [designBBox, markPositions, orientation, paperKey]);

  const fitDimensions = useMemo(
    () => getPaperDimensionsMm({ designBBox, markPositions, orientation, paperKey: 'fit' }),
    [designBBox, markPositions, orientation],
  );

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{lang.step_paper_desc}</div>
      {isPaperTooSmall && <Alert message={sprintf(lang.paper_too_small, PRINT_MARGIN_MM)} showIcon type="warning" />}
      <div className={styles.row}>
        <span className={styles.label}>{lang.paper_size}</span>
        <Select
          onChange={(value: PaperSelection) => setPaperKey(value)}
          options={[
            { label: `${lang.fit_content} (${fitDimensions.widthMm} × ${fitDimensions.heightMm} mm)`, value: 'fit' },
            ...Object.entries(paperSizes).map(([key, { heightMm, label, widthMm }]) => ({
              label: `${label} (${widthMm} × ${heightMm} mm)`,
              value: key,
            })),
          ]}
          value={paperKey}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{lang.orientation}</span>
        <Radio.Group
          disabled={paperKey === 'fit'}
          onChange={(e) => setOrientation(e.target.value)}
          options={[
            { label: lang.orientation_portrait, value: 'portrait' },
            { label: lang.orientation_landscape, value: 'landscape' },
          ]}
          optionType="button"
          value={orientation}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{lang.grid_columns}</span>
        <InputNumber max={25} min={1} onChange={(value) => setGrid({ gridColumns: value ?? 1 })} value={gridColumns} />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{lang.grid_rows}</span>
        <InputNumber max={25} min={1} onChange={(value) => setGrid({ gridRows: value ?? 1 })} value={gridRows} />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{lang.grid_spacing}</span>
        <InputNumber max={100} min={0} onChange={(value) => setGrid({ gridGapMm: value ?? 0 })} value={gridGapMm} />
      </div>
    </div>
  );
};

export default StepPaper;
