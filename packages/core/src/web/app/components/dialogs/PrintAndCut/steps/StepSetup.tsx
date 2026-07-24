import React, { useEffect, useMemo, useRef } from 'react';

import { Alert, InputNumber, Radio } from 'antd';
import { funnel } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import { CUT_ELEMENT_SELECTOR } from '../constants';
import styles from '../index.module.scss';
import type { CutSource } from '../store';
import { usePrintAndCutStore } from '../store';
import { computeCutPathD } from '../utils/computeCutPathD';

const StepSetup = (): React.JSX.Element => {
  const lang = useI18n();
  const tPrintAndCut = lang.print_and_cut;
  const tOffset = lang.beambox.tool_panels._offset;
  const {
    cutLayerName,
    cutSource,
    designBBox,
    offsetDistance,
    setCutLayerName,
    setCutPathD,
    setCutSource,
    setOffsetDistance,
  } = usePrintAndCutStore(
    useShallow(
      ({
        cutLayerName,
        cutSource,
        designBBox,
        offsetDistance,
        setCutLayerName,
        setCutPathD,
        setCutSource,
        setOffsetDistance,
      }) => ({
        cutLayerName,
        cutSource,
        designBBox,
        offsetDistance,
        setCutLayerName,
        setCutPathD,
        setCutSource,
        setOffsetDistance,
      }),
    ),
  );

  // layers usable as a cut path: they must contain at least one cuttable vector element
  const pathLayers = useMemo(
    () =>
      layerManager
        .getAllLayers()
        .filter((layer) => layer.getGroup().querySelector(CUT_ELEMENT_SELECTOR))
        .map((layer) => ({ color: layer.getColor(), name: layer.getName() })),
    [],
  );

  // leading call computes the path right away on step entry, trailing call
  // coalesces rapid offset changes; current inputs are read from the store so
  // the funnel can live across renders without stale closures
  const runIdRef = useRef(0);
  const computeFunnel = useMemo(
    () =>
      funnel(
        async () => {
          const { designBBox, offsetDistance, setCutPathD } = usePrintAndCutStore.getState();

          runIdRef.current += 1;

          const runId = runIdRef.current;
          const cutPathD = await computeCutPathD(designBBox, offsetDistance);

          // a superseded run can still resolve after a newer one; only the
          // latest may commit its result
          if (runIdRef.current === runId) setCutPathD(cutPathD);
        },
        { minQuietPeriodMs: 300, triggerAt: 'both' },
      ),
    [],
  );

  useEffect(() => () => computeFunnel.cancel(), [computeFunnel]);

  useEffect(() => {
    if (cutSource === 'layer') {
      computeFunnel.cancel();
      // invalidate any in-flight run so it cannot overwrite the cleared path
      runIdRef.current += 1;
      setCutPathD(null);

      if (!cutLayerName && pathLayers.length > 0) setCutLayerName(pathLayers[0].name);

      return;
    }

    computeFunnel.call();
  }, [computeFunnel, cutLayerName, cutSource, designBBox, offsetDistance, pathLayers, setCutLayerName, setCutPathD]);

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{tPrintAndCut.step_setup_desc}</div>
      <Radio.Group
        className={styles.radioGroup}
        onChange={(e) => setCutSource(e.target.value as CutSource)}
        options={[
          { label: tPrintAndCut.generate_from_contour, value: 'contour' },
          { disabled: pathLayers.length === 0, label: tPrintAndCut.use_layer_as_cut_path, value: 'layer' },
        ]}
        value={cutSource}
      />
      {cutSource === 'contour' ? (
        <div className={styles.row}>
          <span className={styles.label}>{tOffset.dist}</span>
          <InputNumber
            addonAfter="mm"
            max={20}
            min={0.1}
            onChange={(value) => {
              if (value) setOffsetDistance(value);
            }}
            step={0.5}
            value={offsetDistance}
          />
        </div>
      ) : (
        <div className={styles.row}>
          <span className={styles.label}>{tPrintAndCut.select_cut_layer}</span>
          <Select
            onChange={(value: string) => setCutLayerName(value)}
            options={pathLayers.map(({ color, name }) => ({
              label: (
                <span className={styles.optionLabel}>
                  {color && <span className={styles.swatch} style={{ backgroundColor: color }} />}
                  {name}
                </span>
              ),
              value: name,
            }))}
            value={cutLayerName ?? undefined}
          />
        </div>
      )}
      {pathLayers.length === 0 && <Alert message={tPrintAndCut.no_layer_with_path} showIcon type="info" />}
      <Alert message={tPrintAndCut.marks_info} showIcon type="info" />
    </div>
  );
};

export default StepSetup;
