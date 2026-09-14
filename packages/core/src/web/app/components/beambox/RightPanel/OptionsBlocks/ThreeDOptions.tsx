import React, { useEffect, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Segmented, Switch, Tooltip } from 'antd';

import type { EngravingMode } from '@core/app/constants/innerEngraving';
import { LAYER_HEIGHT_LIMIT, POINT_SPACING_LIMIT } from '@core/app/constants/innerEngraving';
import { useStorageStore } from '@core/app/stores/storageStore';
import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import { getStlEngravingParams, setStlEngravingParam } from '@core/app/svgedit/stl/engravingParams';
import { isPhotoPlaneProjection } from '@core/app/svgedit/stl/getters';
import { applyPhotoPointCloud } from '@core/app/svgedit/stl/photoPointCloud';
import { generatePhotoPointCloud } from '@core/app/svgedit/stl/photoPointCloudGenerator';
import UnitInput from '@core/app/widgets/UnitInput';
import { isUvDev2 } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import styles from './ThreeDOptions.module.scss';

interface Props {
  elem: Element;
  hideEngravingMode?: boolean;
}

/**
 * Shared processing options for a 3D projection, including imported STL, extruded SVG and photo planes.
 *
 * The values live on the projection element as attributes, not in the STL store, because they are read
 * by the **backend** from the svg string (see `svgedit/stl/engravingParams.ts`). This component only
 * mirrors them into local state so the inputs stay responsive.
 */
const ThreeDOptions = ({ elem, hideEngravingMode = false }: Props): React.JSX.Element => {
  const { inner_engraving_settings: t } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const isPhoto = isPhotoPlaneProjection(elem);
  const showTestPointCloud = isPhoto && isUvDev2();
  const readParams = () => {
    const next = getStlEngravingParams(elem);

    if (isPhotoPlaneProjection(elem)) {
      next.mode = elem.getAttribute('data-shading') === 'true' ? 'dot' : 'line';
    }

    return next;
  };
  const [params, setParams] = useState(readParams);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<null | string>(null);
  const fill = elem.getAttribute('fill') || '#000000';
  const isFilled =
    !isPhoto &&
    Number.parseFloat(elem.getAttribute('fill-opacity') ?? '1') !== 0 &&
    !['#fff', '#ffffff', 'none'].includes(fill.toLowerCase());
  const showLayerHeight = params.mode === 'line' || isFilled;
  const showAdaptiveLayerHeight = !isPhoto && params.mode === 'line';

  // the selection can change without this component unmounting, and undo can change the attributes
  // underneath us
  useEffect(() => {
    const refresh = () => setParams(readParams());
    const observer = new MutationObserver(refresh);

    refresh();
    observer.observe(elem, {
      attributeFilter: [
        'data-shading',
        'fill',
        'fill-opacity',
        STL_ATTR.layerHeight,
        STL_ATTR.minLayerHeight,
        STL_ATTR.mode,
        STL_ATTR.pointSpacing,
      ],
      attributes: true,
    });

    return () => observer.disconnect();
    // readParams always reads the current attributes from elem; changing elem replaces the observer.
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [elem]);

  const update = (attr: string, value: number | string) => {
    setStlEngravingParam(elem, attr, value);
    setParams(readParams());
  };

  const generateTestPointCloud = async () => {
    setGenerationError(null);
    setIsGenerating(true);

    try {
      const buffer = await generatePhotoPointCloud(elem as SVGImageElement, readParams());

      applyPhotoPointCloud(elem.id, buffer);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Unable to generate point cloud');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderRow = (label: string, control: React.ReactNode, key: string, tooltip?: string) => (
    <div className={styles.row} key={key}>
      <div className={styles.label}>
        <span title={label}>{label}</span>
        {tooltip && (
          <Tooltip title={tooltip}>
            <QuestionCircleOutlined aria-label={`${label} info`} className={styles.hint} />
          </Tooltip>
        )}
      </div>
      <div className={styles.control}>{control}</div>
    </div>
  );

  const renderLengthInput = (
    id: string,
    value: number,
    attr: string,
    limit: { max: number; min: number },
    isValid: (next: number) => boolean = () => true,
  ) => (
    <UnitInput
      addonAfter={isInch ? 'in' : 'mm'}
      containerClassName={styles.input}
      id={id}
      isInch={isInch}
      max={limit.max}
      min={limit.min}
      onChange={(next) => {
        if (typeof next === 'number' && isValid(next)) update(attr, next);
      }}
      precision={isInch ? 5 : 3}
      size="small"
      value={value}
    />
  );

  const toggleAdaptiveLayerHeight = (enabled: boolean) => {
    if (!enabled) {
      update(STL_ATTR.minLayerHeight, '');

      return;
    }

    const next = Math.max(LAYER_HEIGHT_LIMIT.min, params.layerHeight / 2);

    if (next < params.layerHeight) update(STL_ATTR.minLayerHeight, next);
  };

  return (
    <div className={styles.block}>
      {!hideEngravingMode &&
        renderRow(
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
      {showLayerHeight &&
        renderRow(
          t.layer_height,
          renderLengthInput(
            'stl-layer-height',
            params.layerHeight,
            STL_ATTR.layerHeight,
            {
              ...LAYER_HEIGHT_LIMIT,
              min: params.minLayerHeight
                ? Math.min(LAYER_HEIGHT_LIMIT.max, params.minLayerHeight + LAYER_HEIGHT_LIMIT.min)
                : LAYER_HEIGHT_LIMIT.min,
            },
            (next) => params.minLayerHeight === null || next > params.minLayerHeight,
          ),
          'layer-height',
          params.mode === 'line' ? t.layer_height_hint_line : t.layer_height_hint_dot_fill,
        )}
      {showAdaptiveLayerHeight &&
        renderRow(
          t.adaptive_layer_height,
          <Switch
            checked={params.minLayerHeight !== null}
            disabled={params.layerHeight <= LAYER_HEIGHT_LIMIT.min}
            id="stl-adaptive-layer-height"
            onChange={toggleAdaptiveLayerHeight}
            size="small"
          />,
          'adaptive-layer-height',
          t.adaptive_layer_height_hint,
        )}
      {showAdaptiveLayerHeight &&
        params.minLayerHeight !== null &&
        renderRow(
          t.min_layer_height,
          renderLengthInput(
            'stl-min-layer-height',
            params.minLayerHeight,
            STL_ATTR.minLayerHeight,
            { max: params.layerHeight - LAYER_HEIGHT_LIMIT.min, min: LAYER_HEIGHT_LIMIT.min },
            (next) => next < params.layerHeight,
          ),
          'min-layer-height',
          t.min_layer_height_hint,
        )}
      {/* only dot mode samples the contour into points, so the spacing means nothing in line mode */}
      {params.mode === 'dot' &&
        renderRow(
          t.point_spacing,
          renderLengthInput('stl-point-spacing', params.pointSpacing, STL_ATTR.pointSpacing, POINT_SPACING_LIMIT),
          'point-spacing',
        )}
      {showTestPointCloud ? (
        <Button block loading={isGenerating} onClick={generateTestPointCloud} size="small">
          {t.generate_test_point_cloud ?? 'Generate Test Point Cloud'}
        </Button>
      ) : null}
      {generationError ? <div className={styles.error}>{generationError}</div> : null}
    </div>
  );
};

export default ThreeDOptions;
