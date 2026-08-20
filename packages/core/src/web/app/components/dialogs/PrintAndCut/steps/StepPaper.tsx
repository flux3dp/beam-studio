import React, { useMemo } from 'react';

import { Alert, InputNumber, Radio } from 'antd';
import { sprintf } from 'sprintf-js';

import { dpmm } from '@core/app/actions/beambox/constant';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import type { PaperSelection } from '../constants';
import { paperSizes, PRINT_MARGIN_MM } from '../constants';
import styles from '../index.module.scss';
import { usePrintAndCutStore } from '../store';
import { getContentBBoxFromState, getPaperDimensionsMm } from '../utils/layout';

const StepPaper = (): React.JSX.Element => {
  const { print_and_cut: t } = useI18n();
  const fullBBox = usePrintAndCutStore((state) => state.fullBBox);
  const gridColumns = usePrintAndCutStore((state) => state.gridColumns);
  const gridGapMm = usePrintAndCutStore((state) => state.gridGapMm);
  const gridRows = usePrintAndCutStore((state) => state.gridRows);
  const markPositions = usePrintAndCutStore((state) => state.markPositions);
  const orientation = usePrintAndCutStore((state) => state.orientation);
  const paperKey = usePrintAndCutStore((state) => state.paperKey);
  const setGrid = usePrintAndCutStore((state) => state.setGrid);
  const setOrientation = usePrintAndCutStore((state) => state.setOrientation);
  const setPaperKey = usePrintAndCutStore((state) => state.setPaperKey);

  const isPaperTooSmall = useMemo(() => {
    const contentBBox = getContentBBoxFromState({ fullBBox, markPositions });

    if (!contentBBox) return false;

    const { heightMm, widthMm } = getPaperDimensionsMm({ fullBBox, markPositions, orientation, paperKey });
    const margin = 2 * PRINT_MARGIN_MM;

    return contentBBox.width / dpmm + margin > widthMm || contentBBox.height / dpmm + margin > heightMm;
  }, [fullBBox, markPositions, orientation, paperKey]);

  const fitDimensions = useMemo(
    () => getPaperDimensionsMm({ fullBBox, markPositions, orientation, paperKey: 'fit' }),
    [fullBBox, markPositions, orientation],
  );

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{t.step_paper_desc}</div>
      {isPaperTooSmall && <Alert message={sprintf(t.paper_too_small, PRINT_MARGIN_MM)} showIcon type="warning" />}
      <div className={styles.row}>
        <span className={styles.label}>{t.paper_size}</span>
        <Select
          onChange={(value: PaperSelection) => setPaperKey(value)}
          options={[
            { label: `${t.fit_content} (${fitDimensions.widthMm} × ${fitDimensions.heightMm} mm)`, value: 'fit' },
            ...Object.entries(paperSizes).map(([key, { heightMm, label, widthMm }]) => ({
              label: `${label} (${widthMm} × ${heightMm} mm)`,
              value: key,
            })),
          ]}
          value={paperKey}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t.orientation}</span>
        <Radio.Group
          disabled={paperKey === 'fit'}
          onChange={(e) => setOrientation(e.target.value)}
          options={[
            { label: t.orientation_portrait, value: 'portrait' },
            { label: t.orientation_landscape, value: 'landscape' },
          ]}
          optionType="button"
          value={orientation}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t.grid_columns}</span>
        <InputNumber max={25} min={1} onChange={(value) => setGrid({ gridColumns: value ?? 1 })} value={gridColumns} />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t.grid_rows}</span>
        <InputNumber max={25} min={1} onChange={(value) => setGrid({ gridRows: value ?? 1 })} value={gridRows} />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t.grid_spacing}</span>
        <InputNumber max={100} min={0} onChange={(value) => setGrid({ gridGapMm: value ?? 0 })} value={gridGapMm} />
      </div>
    </div>
  );
};

export default StepPaper;
