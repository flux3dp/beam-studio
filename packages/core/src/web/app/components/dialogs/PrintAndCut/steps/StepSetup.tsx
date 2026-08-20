import React, { useEffect, useMemo, useRef } from 'react';

import { InputNumber, Radio, Tooltip } from 'antd';
import { funnel } from 'remeda';

import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import { CONTOUR_ELEMENT_SELECTOR } from '../constants';
import styles from '../index.module.scss';
import type { ContourSource } from '../store';
import { usePrintAndCutStore } from '../store';
import { computeContourPathD } from '../utils/computeContourPathD';

const StepSetup = (): React.JSX.Element => {
  const { beambox, print_and_cut: t } = useI18n();
  const tOffset = beambox.tool_panels._offset;
  const contourLayerName = usePrintAndCutStore((state) => state.contourLayerName);
  const contourSource = usePrintAndCutStore((state) => state.contourSource);
  const offsetDistance = usePrintAndCutStore((state) => state.offsetDistance);
  const printingContentsBBox = usePrintAndCutStore((state) => state.printingContentsBBox);
  const setContourLayerName = usePrintAndCutStore((state) => state.setContourLayerName);
  const setContourPathD = usePrintAndCutStore((state) => state.setContourPathD);
  const setContourSource = usePrintAndCutStore((state) => state.setContourSource);
  const setOffsetDistance = usePrintAndCutStore((state) => state.setOffsetDistance);

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
      <div className={styles.desc}>{t.step_setup_desc}</div>
      <Radio.Group
        className={styles.radioGroup}
        onChange={(e) => setContourSource(e.target.value as ContourSource)}
        options={[
          { label: t.generate_from_contour, value: 'outline' },
          {
            disabled: pathLayers.length === 0,
            // the option is disabled because no layer qualifies; the tooltip says so
            label:
              pathLayers.length === 0 ? (
                <Tooltip title={t.no_layer_with_path}>{t.use_layer_as_cut_path}</Tooltip>
              ) : (
                t.use_layer_as_cut_path
              ),
            value: 'layer',
          },
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
          <span className={styles.label}>{t.select_cut_layer}</span>
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
    </div>
  );
};

export default StepSetup;
