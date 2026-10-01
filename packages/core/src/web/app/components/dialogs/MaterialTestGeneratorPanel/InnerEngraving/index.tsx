import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';
import { sprintf } from 'sprintf-js';

import svgEditor from '@core/app/actions/beambox/svg-editor';
import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import workareaManager from '@core/app/svgedit/workarea';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

import { getBlockSetting } from '../BlockSetting';
import BlockSettingForm from '../BlockSettingForm';
import type { SvgInfo } from '../generateSvgInfo';
import generateSvgInfo from '../generateSvgInfo';
import styles from '../index.module.scss';
import { paramString } from '../paramString';
import { getTableSetting } from '../TableSetting';
import TableSettingForm from '../TableSettingForm';
import { getTextSetting } from '../TextSetting';
import TextSettingForm from '../TextSettingForm';
import WorkAreaInfo from '../WorkAreaInfo';

import ForceTransformForm from './ForceTransformForm';
import type { LabelItem, LabelOutline } from './generate';
import { createConversionRoot, getLabelBox, insertMaterialTest, outlineLabel } from './generate';
import type { ForceTransform, Vec3 } from './layout';
import { getForceMatrix, getUnionBox, layoutMaterialTest, multiply, TITLE_FONT_SIZE, VALUE_FONT_SIZE } from './layout';

interface InnerEngravingMaterialTestPanelProps {
  onClose: () => void;
}

const PREVIEW_DEBOUNCE = 300;

const getDefaultForceTransform = (): ForceTransform => {
  const { center } = getEngravableBox();

  return {
    offset: center.map((value) => value / MM_TO_SCENE) as ForceTransform['offset'],
    scale: [50, 50, 1],
  };
};

/**
 * Material test generator for inner engraving documents.
 *
 * Builds the same parameter grid as the 2D generator, but out of 3D objects: dot mode blocks and
 * line mode labels. The whole test is laid out flat first, scaled and moved to the forced size and
 * centre, and only then extruded, so the forced size is the size of what actually gets engraved.
 */
const InnerEngravingMaterialTestPanel = ({ onClose }: InnerEngravingMaterialTestPanelProps): React.JSX.Element => {
  const t = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const workarea = useDocumentStore((state) => state.workarea);
  const [tableSetting, setTableSetting] = useState(() => getTableSetting(workarea, { innerEngraving: true }));
  const [blockSetting, setBlockSetting] = useState(getBlockSetting);
  const [textSetting, setTextSetting] = useState(() => getTextSetting(workarea));
  const [force, setForce] = useState(getDefaultForceTransform);
  const [isGenerating, setIsGenerating] = useState(true);
  /** One block's size and the X / Y gaps between blocks in mm once the whole test is forced to its
   *  size, null before the first preview. */
  const [scaledBlock, setScaledBlock] = useState<null | { size: Vec3; spacing: [number, number] }>(null);
  const batchCmd = useRef(new history.BatchCommand('Material Test Generator'));
  // bumped by every preview and on close, so a preview whose outlines arrive late is dropped
  const generation = useRef(0);
  const outlineCache = useRef(new Map<string, Promise<LabelOutline | null>>());
  const root = useMemo(createConversionRoot, []);

  useEffect(
    () => () => {
      generation.current += 1;
      root.remove();
    },
    [root],
  );

  const getOutline = (content: string, fontSize: number): Promise<LabelOutline | null> => {
    const key = `${fontSize}:${content}`;
    let outline = outlineCache.current.get(key);

    if (!outline) {
      outline = outlineLabel(root, content, fontSize).catch((error: unknown) => {
        // not cached, so the next preview tries again
        outlineCache.current.delete(key);
        console.error(`Failed to outline "${content}"`, error);

        return null;
      });
      outlineCache.current.set(key, outline);
    }

    return outline;
  };

  const clearPreview = () => {
    batchCmd.current.unapply();
    // to prevent layer id conflict
    layerManager.identifyLayers();
    batchCmd.current = new history.BatchCommand('Material Test Generator');
  };

  const handlePreview = async () => {
    const current = ++generation.current;
    const svgInfos = generateSvgInfo({ blockSetting, tableSetting });
    const [colKey, rowKey] = (Object.entries(tableSetting) as Array<[keyof SvgInfo, { selected: number }]>)
      .sort(([, { selected: a }], [, { selected: b }]) => a - b)
      .map(([key]) => key);
    const rowCount = blockSetting.row.count.value;
    const colValues = Array.from({ length: blockSetting.column.count.value }, (_, index) =>
      String(svgInfos[index * rowCount][colKey]),
    );
    const rowValues = Array.from({ length: rowCount }, (_, index) => String(svgInfos[index][rowKey]));

    setIsGenerating(true);

    // outlines run one at a time: each conversion opens and closes the same progress dialog
    const outlineAll = async (contents: string[], fontSize: number) => {
      const outlines: Array<LabelOutline | null> = [];

      for (const content of contents) {
        outlines.push(await getOutline(content, fontSize));
      }

      return outlines;
    };
    const [colTitle, rowTitle] = await outlineAll(
      [paramString[colKey as keyof typeof paramString], paramString[rowKey as keyof typeof paramString]],
      TITLE_FONT_SIZE,
    );
    const colValueOutlines = await outlineAll(colValues, VALUE_FONT_SIZE);
    const rowValueOutlines = await outlineAll(rowValues, VALUE_FONT_SIZE);

    if (current !== generation.current) return;

    const layout = layoutMaterialTest(blockSetting, {
      colTitle: colTitle?.box ?? null,
      colValues: colValueOutlines.map((outline) => outline?.box ?? null),
      rowTitle: rowTitle?.box ?? null,
      rowValues: rowValueOutlines.map((outline) => outline?.box ?? null),
    });
    const labels: LabelItem[] = [
      ...[colTitle, rowTitle].map((outline, index) => ({ matrix: [layout.colTitle, layout.rowTitle][index], outline })),
      ...colValueOutlines.map((outline, index) => ({ matrix: layout.colValues[index], outline })),
      ...rowValueOutlines.map((outline, index) => ({ matrix: layout.rowValues[index], outline })),
    ].filter((item): item is LabelItem => Boolean(item.matrix && item.outline));
    const union = getUnionBox([...layout.blocks, ...labels.map(getLabelBox)]);

    clearPreview();

    setScaledBlock(null);

    if (union) {
      const forceMatrix = getForceMatrix(union, force, workareaManager.height);

      // every block has the same size, and the force matrix scales each axis by a fixed factor
      setScaledBlock({
        size: [
          blockSetting.row.size.value * forceMatrix.a,
          blockSetting.column.size.value * forceMatrix.d,
          force.scale[2],
        ],
        spacing: [blockSetting.row.spacing.value * forceMatrix.a, blockSetting.column.spacing.value * forceMatrix.d],
      });

      const transformed = (box: (typeof layout.blocks)[number]) => {
        const { a, d, e, f } = forceMatrix;

        // the force matrix only scales and translates, so a block stays an axis-aligned rect
        return { maxX: a * box.maxX + e, maxY: d * box.maxY + f, minX: a * box.minX + e, minY: d * box.minY + f };
      };

      insertMaterialTest(
        {
          blocks: layout.blocks.map((box, index) => ({ box: transformed(box), info: svgInfos[index] })),
          force,
          labels: labels.map(({ matrix, outline }) => ({ matrix: multiply(forceMatrix, matrix), outline })),
          params: [colKey, rowKey],
          textSetting,
        },
        batchCmd.current,
      );
    }

    setIsGenerating(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handlePreview().catch((error: unknown) => {
        console.error('Failed to generate the material test', error);
        setIsGenerating(false);
      });
    }, PREVIEW_DEBOUNCE);

    return () => clearTimeout(timer);
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [tableSetting, blockSetting, textSetting, force]);

  const lengthUnit = isInch ? 'in' : 'mm';
  const formatLengths = (values: number[]) =>
    values.map((mm) => (isInch ? (mm / 25.4).toFixed(3) : mm.toFixed(2))).join(' x ');

  const handleExport = () => {
    generation.current += 1;
    undoManager.addCommandToHistory(batchCmd.current);

    svgEditor.updateContextPanel();
    layerManager.resync();

    onClose();
  };

  const handleCancel = () => {
    generation.current += 1;
    batchCmd.current.unapply();
    // to prevent layer id conflict
    layerManager.identifyLayers();

    onClose();
  };

  return (
    <DraggableModal
      footer={
        <div className={styles.footer}>
          <Button onClick={handleCancel}>{t.global.cancel}</Button>
          <Button disabled={isGenerating} loading={isGenerating} onClick={handleExport} type="primary">
            {t.material_test_generator.export}
          </Button>
        </div>
      }
      onCancel={handleCancel}
      open
      title={t.material_test_generator.title}
      width={640}
      wrapClassName={styles['modal-wrap']}
    >
      <div className={styles['mb-28']}>
        <WorkAreaInfo isInch={isInch} />
      </div>

      <TableSettingForm
        blockOption="cut"
        className={styles['mb-28']}
        handleChange={setTableSetting}
        isInch={isInch}
        tableSetting={tableSetting}
        workarea={workarea}
      />

      <BlockSettingForm
        blockSetting={blockSetting}
        className={styles['mb-28']}
        handleChange={setBlockSetting}
        isInch={isInch}
      />

      <div className={styles['mb-28']}>
        <ForceTransformForm handleChange={setForce} isInch={isInch} value={force} />
        {scaledBlock && (
          <div className={classNames(styles['preview-subtext'], styles['mt-8'])}>
            <div>
              {sprintf(t.material_test_generator.scaled_block_size, formatLengths(scaledBlock.size), lengthUnit)}
            </div>
            <div>
              {sprintf(t.material_test_generator.scaled_block_spacing, formatLengths(scaledBlock.spacing), lengthUnit)}
            </div>
          </div>
        )}
      </div>

      <TextSettingForm handleChange={setTextSetting} isInch={isInch} setting={textSetting} />
    </DraggableModal>
  );
};

export default InnerEngravingMaterialTestPanel;
