import React, { useEffect, useMemo, useRef } from 'react';

import { Alert, InputNumber, Radio } from 'antd';
import { funnel } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import { CONTOUR_ELEMENT_SELECTOR } from '../constants';
import styles from '../index.module.scss';
import type { ContourSource } from '../store';
import { usePrintAndCutStore } from '../store';
import { computeContourPathD } from '../utils/computeContourPathD';

const StepSetup = (): React.JSX.Element => {
  const lang = useI18n();
  const tPrintAndCut = lang.print_and_cut;
  const tOffset = lang.beambox.tool_panels._offset;
  const {
    contourLayerName,
    contourSource,
    offsetDistance,
    printingContentsBBox,
    setContourLayerName,
    setContourPathD,
    setContourSource,
    setOffsetDistance,
  } = usePrintAndCutStore(
    useShallow(
      ({
        contourLayerName,
        contourSource,
        offsetDistance,
        printingContentsBBox,
        setContourLayerName,
        setContourPathD,
        setContourSource,
        setOffsetDistance,
      }) => ({
        contourLayerName,
        contourSource,
        offsetDistance,
        printingContentsBBox,
        setContourLayerName,
        setContourPathD,
        setContourSource,
        setOffsetDistance,
      }),
    ),
  );

  // layers usable as a cut path: they must contain at least one cuttable vector element
  const pathLayers = useMemo(
    () =>
      layerManager
        .getAllLayers()
        .filter((layer) => layer.getGroup().querySelector(CONTOUR_ELEMENT_SELECTOR))
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
          const { offsetDistance, printingContentsBBox, setContourPathD } = usePrintAndCutStore.getState();

          runIdRef.current += 1;

          const runId = runIdRef.current;
          const contourPathD = await computeContourPathD(printingContentsBBox, offsetDistance);

          // a superseded run can still resolve after a newer one; only the
          // latest may commit its result
          if (runIdRef.current === runId) setContourPathD(contourPathD);
        },
        { minQuietPeriodMs: 300, triggerAt: 'both' },
      ),
    [],
  );

  useEffect(() => () => computeFunnel.cancel(), [computeFunnel]);

  useEffect(() => {
    if (contourSource === 'layer') {
      computeFunnel.cancel();
      // invalidate any in-flight run so it cannot overwrite the cleared path
      runIdRef.current += 1;
      setContourPathD(null);

      if (!contourLayerName && pathLayers.length > 0) setContourLayerName(pathLayers[0].name);

      return;
    }

    computeFunnel.call();
  }, [
    computeFunnel,
    contourLayerName,
    contourSource,
    printingContentsBBox,
    offsetDistance,
    pathLayers,
    setContourLayerName,
    setContourPathD,
  ]);

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{tPrintAndCut.step_setup_desc}</div>
      <Radio.Group
        className={styles.radioGroup}
        onChange={(e) => setContourSource(e.target.value as ContourSource)}
        options={[
          { label: tPrintAndCut.generate_from_contour, value: 'outline' },
          { disabled: pathLayers.length === 0, label: tPrintAndCut.use_layer_as_cut_path, value: 'layer' },
        ]}
        value={contourSource}
      />
      {contourSource === 'outline' ? (
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
            onChange={(value: string) => setContourLayerName(value)}
            options={pathLayers.map(({ color, name }) => ({
              label: (
                <span className={styles.optionLabel}>
                  {color && <span className={styles.swatch} style={{ backgroundColor: color }} />}
                  {name}
                </span>
              ),
              value: name,
            }))}
            value={contourLayerName ?? undefined}
          />
        </div>
      )}
      {pathLayers.length === 0 && <Alert message={tPrintAndCut.no_layer_with_path} showIcon type="info" />}
      <Alert message={tPrintAndCut.marks_info} showIcon type="info" />
    </div>
  );
};

export default StepSetup;
