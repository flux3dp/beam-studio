import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Flex, Radio } from 'antd';
import { sprintf } from 'sprintf-js';

import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import { galvoModulesArray } from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import createNewText from '@core/app/svgedit/text/createNewText';
import { setRotationAngle } from '@core/app/svgedit/transform/rotation';
import workareaManager from '@core/app/svgedit/workarea';
import DraggableModal from '@core/app/widgets/DraggableModal';
import updateElementColor from '@core/helpers/color/updateElementColor';
import type { GalvoModule } from '@core/helpers/device/galvoConfig';
import { galvoWorkareaOptions, getGalvoConfig, hasGalvoConfig } from '@core/helpers/device/galvoConfig';
import { getModuleOffsets } from '@core/helpers/device/moduleOffsets';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import deviceMaster from '@core/helpers/device-master';
import { applyModuleBaseConfig, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { BlockInfo, BlockSetting } from './BlockSetting';
import { getBlockSetting } from './BlockSetting';
import BlockSettingForm from './BlockSettingForm';
import { BLACK_PIXEL_PNG, BLACK_PIXEL_THRESHOLD } from './constants';
import type { SvgInfo } from './generateSvgInfo';
import generateSvgInfo from './generateSvgInfo';
import styles from './index.module.scss';
import ModuleSettingForm from './ModuleSettingForm';
import { getTableSetting } from './TableSetting';
import TableSettingForm from './TableSettingForm';
import { getTextSetting } from './TextSetting';
import TextSettingForm from './TextSettingForm';
import WorkAreaInfo from './WorkAreaInfo';

interface Props {
  onClose: () => void;
}

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const { dpmm } = constant;

const paramWidth = {
  dottingTime: 101.2,
  fillInterval: 96.77,
  frequency: 97.31,
  pulseWidth: 97.79,
  repeat: 42.63,
  speed: 81.61,
  strength: 60.66,
} as const;
/** What the size limits assume while the field is unknown: the smaller lens, so a block never hides a seam. */
const FALLBACK_FIELD_MM = Math.min(...galvoWorkareaOptions);

type BlockOption = 'cut' | 'dotCompare' | 'engrave';

const paramString = {
  dottingTime: 'Dotting Time (us)',
  fillInterval: 'Fill Interval (mm)',
  frequency: 'Frequency (kHz)',
  pulseWidth: 'Pulse Width (ns)',
  repeat: 'Passes',
  speed: 'Speed (mm/s)',
  strength: 'Power (%)',
} as const;

/**
 * How far to shift the test for a module offset, in mm.
 *
 * Rounded up to tens: the shift has to clear the boundary rather than land on it, and rounding down
 * would leave the test short of what the offset costs. A round number also keeps the generated test
 * on a grid somebody can measure against. Floored at zero: a head offset the other way loses travel
 * at the far edge instead, which the canvas boundary already accounts for, so shifting for it would
 * push the test toward that edge rather than away from anything.
 */
const offsetToOrigin = (value: number) => Math.max(Math.ceil(value / 10) * 10, 0);

const getTextAdjustment = (rawText: number | string) => (rawText.toString().length * 2.7) / 2;
const getEnd = (start: number, block: BlockInfo) =>
  start + (block.count.value - 1) * (block.spacing.value + block.size.value);

const MaterialTestGeneratorPanel = ({ onClose }: Props): React.JSX.Element => {
  const t = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const { laserType } = getPromarkInfo();
  const workarea = useDocumentStore((state) => state.workarea);
  const { isMopa, isPromark } = useMemo(
    () => ({
      isMopa: laserType === LaserType.MOPA,
      isPromark: promarkModels.has(workarea),
    }),
    [laserType, workarea],
  );
  const galvoModules = useMemo(() => {
    const supported = getSupportedModules(workarea);

    return galvoModulesArray.filter((module) => supported.includes(module));
  }, [workarea]);
  const [blockOption, setBlockOption] = useState<BlockOption>('cut');
  const isDotCompare = blockOption === 'dotCompare';
  const [module, setModule] = useState<GalvoModule>(galvoModules[0] ?? galvoModulesArray[0]);
  /** mm, null until a machine has been asked. See readMachineValues below. */
  const [fieldSize, setFieldSize] = useState<null | number>(null);
  /**
   * Where the whole test is placed, in mm, to keep it inside what the chosen head can reach.
   *
   * A galvo head sits well away from the gantry reference point, so the canvas edge nearest it is
   * not somewhere that head can work; content left at the origin would sit outside its boundary.
   * See offsetToOrigin for how the offset becomes this.
   */
  const [originOffset, setOriginOffset] = useState<[number, number]>([0, 0]);
  const [tableSetting, setTableSetting] = useState(getTableSetting(workarea, { isDotCompare, laserType }));
  const [blockSetting, setBlockSetting] = useState(getBlockSetting);
  const [textSetting, setTextSetting] = useState(getTextSetting(workarea));
  const [isTextSettingTouched, setIsTextSettingTouched] = useState(false);
  const blockOptions = [
    { label: t.material_test_generator.cut, value: 'cut' },
    { label: t.material_test_generator.engrave, value: 'engrave' },
    ...(galvoModules.length ? [{ label: t.material_test_generator.dot_compare, value: 'dotCompare' }] : []),
  ];
  /**
   * In dot-compare mode a block is two half blocks side by side, and the settings form edits one
   * half -- that is what the field has to hold. The generators lay out whole blocks, so they are
   * handed the doubled width.
   */
  const effectiveBlockSetting = useMemo(
    () =>
      isDotCompare
        ? {
            ...blockSetting,
            row: {
              ...blockSetting.row,
              size: { ...blockSetting.row.size, value: blockSetting.row.size.value * 2 },
            },
          }
        : blockSetting,
    [blockSetting, isDotCompare],
  );
  const batchCmd = useRef(new history.BatchCommand('Material Test Generator'));

  /**
   * The field only exists on the machine, and most of the time nobody has asked it: this panel
   * opens with no machine selected, or with one that has never been read. So it is asked for here,
   * and only when asking is free of consequences -- the right model, and no sub task holding the
   * control socket, which refuses config reads. Everything still works without an answer; the size
   * limits just fall back to the smaller lens.
   */
  useEffect(() => {
    if (!isDotCompare) {
      setOriginOffset([0, 0]);

      return;
    }

    let cancelled = false;

    const readMachineValues = async () => {
      // The offset has a stored default for every supported module, so it answers with or without a
      // machine; the field only exists on the machine.
      try {
        const [offsetX, offsetY] = await getModuleOffsets({ module, workarea });

        if (!cancelled) {
          setOriginOffset([offsetToOrigin(offsetX), offsetToOrigin(offsetY)]);
        }
      } catch (error) {
        console.error('Failed to read the module offset', error);
      }

      const device = deviceMaster.currentDevice;

      // Asked only where asking is free of consequences: the right model, and no sub task holding
      // the control socket, which refuses config reads.
      if (device?.info.model !== 'fhx2galvo' || device.control?.getMode()) return;

      try {
        // hasGalvoConfig first: an unconfigured head answers with plausible defaults, and showing
        // those as a reading is worse than admitting we do not know.
        if (!(await hasGalvoConfig(module))) return;

        const { workarea: field } = await getGalvoConfig(module);

        if (!cancelled) setFieldSize(field);
      } catch (error) {
        console.error('Failed to read the galvo field size', error);
      }
    };

    setFieldSize(null);
    readMachineValues();

    return () => {
      cancelled = true;
    };
  }, [isDotCompare, module, workarea]);

  // The axes differ per mode, and the size limits follow whichever field was found.
  useEffect(() => {
    setTableSetting(getTableSetting(workarea, { isDotCompare, laserType }));
    setBlockSetting(getBlockSetting(isDotCompare ? { fieldSize: fieldSize ?? FALLBACK_FIELD_MM } : {}));
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [isDotCompare, fieldSize, workarea]);

  // The labels are engraved by the same head, so their speed starts from that head's own default --
  // but only until somebody sets one, which is a decision and should survive a mode change.
  useEffect(() => {
    if (isTextSettingTouched) return;

    setTextSetting(getTextSetting(workarea, isDotCompare ? module : undefined));
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [isDotCompare, module, workarea]);

  /**
   * Put a layer on the head under test, with that head's own base parameters. Every layer the test
   * creates goes through here: a layer left on the default module would be engraved by the gantry
   * head instead, at a speed meant for it, and the galvo settings on it would be read by nobody.
   */
  const applyTestModule = (layer: Element, batchCmd: IBatchCommand) => {
    if (!isDotCompare) return;

    writeDataLayer(layer, 'module', module);
    applyModuleBaseConfig(layer, module, { parentCmd: batchCmd });
  };

  const generateText = (svgInfos: SvgInfo[], blockSetting: BlockSetting, batchCmd: IBatchCommand) => {
    const { column, row } = blockSetting;
    const [offsetX, offsetY] = originOffset.map((value) => value * dpmm);
    const [startPadding, endPadding] = [30, 10];
    const [right, bottom] = [row, column].map((block) => getEnd(startPadding, block));
    const [width, height] = [
      (right + row.size.value + endPadding * 2) * dpmm,
      (bottom + column.size.value + endPadding * 2) * dpmm,
    ];
    const [colParam, rowParam] = Object.entries(tableSetting).sort(
      ([, { selected: a }], [, { selected: b }]) => a - b,
    ) as unknown as [[keyof typeof paramWidth, { selected: number }], [keyof typeof paramWidth, { selected: number }]];

    const { layer: frameLayer } = createLayer('Material Test - Frame', {
      hexCode: '#000',
      initConfig: true,
      parentCmd: batchCmd,
    });

    // The frame and labels go on the same head as the blocks even though they are too large for one
    // galvo field and will be split. A split frame is only a seam in the frame; a frame on another
    // head would be engraved through a different module offset, so it would no longer surround the
    // blocks it labels, and running the test would mean switching heads mid-job.
    applyTestModule(frameLayer, batchCmd);

    svgCanvas.addSvgElementFromJson({
      attr: {
        fill: 'none',
        'fill-opacity': 0,
        height,
        id: svgCanvas.getNextId(),
        opacity: 1,
        rx: 50,
        stroke: '#000',
        width,
        x: offsetX,
        y: offsetY,
      },
      curStyles: false,
      element: 'rect',
    });

    const { layer: infoLayer } = createLayer('Material Test - Info', {
      hexCode: '#000',
      initConfig: true,
      parentCmd: batchCmd,
    });

    applyTestModule(infoLayer, batchCmd);
    writeDataLayer(infoLayer, 'power', textSetting.power);
    writeDataLayer(infoLayer, 'speed', textSetting.speed);
    // rowText
    createNewText(
      offsetX + (startPadding + (right - startPadding) / 2 - paramWidth[rowParam[0]] / 2) * dpmm,
      offsetY + (startPadding / 2) * dpmm,
      {
        fill: '#000',
        fontSize: 130,
        isDefaultFont: true,
        text: paramString[rowParam[0]],
      },
    );

    const colText = createNewText(
      // magic number to align the text
      offsetX + (-(paramWidth[colParam[0]] * 0.55) + 13.19) * dpmm,
      offsetY + (startPadding + (bottom - startPadding) / 2 + paramWidth[colParam[0]] / 10) * dpmm,
      {
        fill: '#000',
        fontSize: 130,
        isDefaultFont: true,
        text: paramString[colParam[0]],
      },
    );

    setRotationAngle(colText, -90, { addToHistory: false });

    Array.from({ length: row.count.value }).forEach((_, index) => {
      const rowText = createNewText(
        offsetX +
          (startPadding +
            (row.size.value + row.spacing.value) * index +
            row.size.value / 2 -
            getTextAdjustment(svgInfos[index][rowParam[0]]!) +
            10) *
            dpmm,
        offsetY + startPadding * dpmm,
        {
          fill: '#000',
          fontSize: 48,
          isDefaultFont: true,
          text: svgInfos[index][rowParam[0]]!.toString(),
        },
      );

      setRotationAngle(rowText, 90, { addToHistory: false });
    });

    Array.from({ length: column.count.value }).forEach((_, index) => {
      createNewText(
        offsetX + (startPadding - 10) * dpmm,
        offsetY +
          (startPadding + (column.size.value + column.spacing.value) * index + column.size.value / 2 + 4 / 2 + 10) *
            dpmm,
        {
          fill: '#000',
          fontSize: 48,
          isDefaultFont: true,
          text: svgInfos[index * row.count.value][colParam[0]]!.toString(),
        },
      );
    });
  };

  const generateBlocks = (svgInfos: SvgInfo[], blockSetting: BlockSetting, batchCmd: IBatchCommand) => {
    const { column, row } = blockSetting;
    const [offsetX, offsetY] = originOffset.map((value) => value * dpmm);
    const startPadding = 30;
    const [width, height] = [row.size.value, column.size.value].map((value) => value * dpmm);
    const [right, bottom] = [row, column].map((block) => getEnd(startPadding, block) + 10);
    let [x, y] = [offsetX + right * dpmm, offsetY + bottom * dpmm];

    [...svgInfos]
      .reverse()
      .forEach(({ dottingTime, fillInterval, frequency, name, pulseWidth, repeat, speed, strength }, index) => {
        const { layer } = createLayer(name, { initConfig: true, parentCmd: batchCmd });

        writeDataLayer(layer, 'power', strength);
        writeDataLayer(layer, 'speed', speed);
        writeDataLayer(layer, 'repeat', repeat);

        if (isPromark) {
          writeDataLayer(layer, 'fillInterval', fillInterval);
          writeDataLayer(layer, 'frequency', frequency);
        }

        if (isMopa) {
          writeDataLayer(layer, 'pulseWidth', pulseWidth);
        }

        const elements: SVGElement[] = [];

        if (isDotCompare) {
          // The layer carries both halves: the exporter reads a dithered image as dots at this
          // dotting time and a binarised one as line runs at this speed, so the two parameters
          // drive one half each and neither interferes with the other.
          applyTestModule(layer, batchCmd);
          writeDataLayer(layer, 'speed', speed);
          writeDataLayer(layer, 'dottingTime', dottingTime!);
          // The layer's own resolution is left alone, which is the one picked in Document Settings:
          // both halves are rasterized at it, so it is the dot lattice pitch and the line pitch at
          // once. Change it there to compare at a different pitch.

          const halfWidth = width / 2;

          elements.push(
            // Dot half first, line half second, which engraves the line half first: the exporter
            // collects a layer's bitmaps in reverse, so the last image in the layer is the first one
            // marked. Read that way round before swapping these.
            ...(
              [
                [x + halfWidth, true],
                [x, false],
              ] as Array<[number, boolean]>
            ).map(([blockX, shading]) =>
              svgCanvas.addSvgElementFromJson({
                attr: {
                  'data-ratiofixed': true,
                  'data-shading': shading,
                  'data-threshold': BLACK_PIXEL_THRESHOLD,
                  height,
                  id: svgCanvas.getNextId(),
                  origImage: BLACK_PIXEL_PNG,
                  preserveAspectRatio: 'none',
                  style: 'pointer-events:inherit',
                  width: halfWidth,
                  x: blockX,
                  y,
                },
                curStyles: false,
                element: 'image',
              }),
            ),
          );
          elements.forEach((element) => svgCanvas.setHref(element, BLACK_PIXEL_PNG));
        } else {
          elements.push(
            svgCanvas.addSvgElementFromJson({
              attr: {
                fill: blockOption === 'engrave' ? '#000' : 'none',
                'fill-opacity': blockOption === 'engrave' ? 1 : 0,
                height,
                id: svgCanvas.getNextId(),
                opacity: 1,
                stroke: '#000',
                width,
                x,
                y,
              },
              curStyles: false,
              element: 'rect',
            }),
          );
        }

        if ((index + 1) % row.count.value === 0) {
          x = offsetX + right * dpmm;
          y -= (column.size.value + column.spacing.value) * dpmm;
        } else {
          x -= (row.size.value + row.spacing.value) * dpmm;
        }

        elements.forEach((element) => updateElementColor(element));
      });
  };

  const handlePreview = () => {
    const svgInfos = generateSvgInfo({ blockSetting: effectiveBlockSetting, tableSetting });

    batchCmd.current.unapply();
    // to prevent layer id conflict
    layerManager.identifyLayers();

    batchCmd.current = new history.BatchCommand('Material Test Generator');

    generateBlocks(svgInfos, effectiveBlockSetting, batchCmd.current);
    generateText(svgInfos, effectiveBlockSetting, batchCmd.current);
  };

  const handleExport = () => {
    undoManager.addCommandToHistory(batchCmd.current);

    svgEditor.updateContextPanel();
    layerManager.resync();

    onClose();
  };

  const handleCancel = () => {
    batchCmd.current.unapply();
    // to prevent layer id conflict
    layerManager.identifyLayers();

    onClose();
  };

  React.useEffect(() => {
    workareaManager.resetView();
    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [tableSetting, blockSetting, textSetting, blockOption, module]);

  return (
    <DraggableModal
      footer={
        <div className={styles.footer}>
          <Button onClick={handleCancel}>{t.global.cancel}</Button>
          <Button onClick={handleExport} type="primary">
            {t.material_test_generator.export}
          </Button>
        </div>
      }
      onCancel={handleCancel}
      open
      title={t.material_test_generator.title}
      wrapClassName={styles['modal-wrap']}
    >
      <Flex className={styles['mb-28']} justify="space-between">
        <WorkAreaInfo isInch={isInch} />
        <Radio.Group
          onChange={({ target: { value } }) => {
            setBlockOption(value);
          }}
          options={blockOptions}
          optionType="button"
          value={blockOption}
        />
      </Flex>

      {isDotCompare && (
        <ModuleSettingForm
          className={styles['mb-28']}
          fallbackFieldSize={FALLBACK_FIELD_MM}
          fieldSize={fieldSize}
          module={module}
          modules={galvoModules}
          onModuleChange={setModule}
        />
      )}

      <TableSettingForm
        blockOption={blockOption}
        className={styles['mb-28']}
        handleChange={setTableSetting}
        isInch={isInch}
        laserType={laserType}
        tableSetting={tableSetting}
        workarea={workarea}
      />

      <BlockSettingForm
        blockSetting={blockSetting}
        className={styles['mb-28']}
        handleChange={setBlockSetting}
        hint={isDotCompare ? sprintf(t.material_test_generator.size_limit_hint, fieldSize ?? FALLBACK_FIELD_MM) : ''}
        isInch={isInch}
      />

      <TextSettingForm
        handleChange={(setting) => {
          setIsTextSettingTouched(true);
          setTextSetting(setting);
        }}
        isInch={isInch}
        setting={textSetting}
      />
    </DraggableModal>
  );
};

export default MaterialTestGeneratorPanel;
