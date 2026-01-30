import React, { useMemo, useRef, useState } from 'react';

import { Button, Flex, Radio } from 'antd';

import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import { LaserType } from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import createNewText from '@core/app/svgedit/text/createNewText';
import workareaManager from '@core/app/svgedit/workarea';
import DraggableModal from '@core/app/widgets/DraggableModal';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { BlockInfo, BlockSetting } from './BlockSetting';
import { getBlockSetting } from './BlockSetting';
import BlockSettingForm from './BlockSettingForm';
import type { SvgInfo } from './generateSvgInfo';
import generateSvgInfo from './generateSvgInfo';
import styles from './index.module.scss';
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
  fillInterval: 96.77,
  frequency: 97.31,
  pulseWidth: 97.79,
  repeat: 42.63,
  speed: 81.61,
  strength: 60.66,
} as const;
const paramString = {
  fillInterval: 'Fill Interval (mm)',
  frequency: 'Frequency (kHz)',
  pulseWidth: 'Pulse Width (ns)',
  repeat: 'Passes',
  speed: 'Speed (mm/s)',
  strength: 'Power (%)',
} as const;

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
  const [blockOption, setBlockOption] = useState<'cut' | 'engrave'>('cut');
  const [tableSetting, setTableSetting] = useState(getTableSetting(workarea, { laserType }));
  const [blockSetting, setBlockSetting] = useState(getBlockSetting);
  const [textSetting, setTextSetting] = useState(getTextSetting(workarea));
  const blockOptions = [
    { label: t.material_test_generator.cut, value: 'cut' },
    { label: t.material_test_generator.engrave, value: 'engrave' },
  ];
  const batchCmd = useRef(new history.BatchCommand('Material Test Generator'));

  const generateText = (svgInfos: SvgInfo[], blockSetting: BlockSetting, batchCmd: IBatchCommand) => {
    const { column, row } = blockSetting;
    const [startPadding, endPadding] = [30, 10];
    const [right, bottom] = [row, column].map((block) => getEnd(startPadding, block));
    const [width, height] = [
      (right + row.size.value + endPadding * 2) * dpmm,
      (bottom + column.size.value + endPadding * 2) * dpmm,
    ];
    const [colParam, rowParam] = Object.entries(tableSetting).sort(
      ([, { selected: a }], [, { selected: b }]) => a - b,
    ) as unknown as [[keyof typeof paramWidth, { selected: number }], [keyof typeof paramWidth, { selected: number }]];

    createLayer('Material Test - Frame', {
      hexCode: '#000',
      initConfig: true,
      parentCmd: batchCmd,
    });

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
        x: 0,
        y: 0,
      },
      curStyles: false,
      element: 'rect',
    });

    const { layer: infoLayer } = createLayer('Material Test - Info', {
      hexCode: '#000',
      initConfig: true,
      parentCmd: batchCmd,
    });

    writeDataLayer(infoLayer, 'power', textSetting.power);
    writeDataLayer(infoLayer, 'speed', textSetting.speed);
    // rowText
    createNewText(
      (startPadding + (right - startPadding) / 2 - paramWidth[rowParam[0]] / 2) * dpmm,
      (startPadding / 2) * dpmm,
      {
        fill: '#000',
        fontSize: 130,
        isDefaultFont: true,
        text: paramString[rowParam[0]],
      },
    );

    const colText = createNewText(
      // magic number to align the text
      (-(paramWidth[colParam[0]] * 0.55) + 13.19) * dpmm,
      (startPadding + (bottom - startPadding) / 2 + paramWidth[colParam[0]] / 10) * dpmm,
      {
        fill: '#000',
        fontSize: 130,
        isDefaultFont: true,
        text: paramString[colParam[0]],
      },
    );

    svgCanvas.setRotationAngle(-90, true, colText);

    Array.from({ length: row.count.value }).forEach((_, index) => {
      const rowText = createNewText(
        (startPadding +
          (row.size.value + row.spacing.value) * index +
          row.size.value / 2 -
          getTextAdjustment(svgInfos[index][rowParam[0]]!) +
          10) *
          dpmm,
        startPadding * dpmm,
        {
          fill: '#000',
          fontSize: 48,
          isDefaultFont: true,
          text: svgInfos[index][rowParam[0]]!.toString(),
        },
      );

      svgCanvas.setRotationAngle(90, true, rowText);
    });

    Array.from({ length: column.count.value }).forEach((_, index) => {
      createNewText(
        (startPadding - 10) * dpmm,
        (startPadding + (column.size.value + column.spacing.value) * index + column.size.value / 2 + 4 / 2 + 10) * dpmm,
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
    const startPadding = 30;
    const [width, height] = [row.size.value, column.size.value].map((value) => value * dpmm);
    const [right, bottom] = [row, column].map((block) => getEnd(startPadding, block) + 10);
    let [x, y] = [right, bottom].map((value) => value * dpmm);

    [...svgInfos].reverse().forEach(({ fillInterval, frequency, name, pulseWidth, repeat, speed, strength }, index) => {
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

      const newRect = svgCanvas.addSvgElementFromJson({
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
      });

      if ((index + 1) % row.count.value === 0) {
        x = right * dpmm;
        y -= (column.size.value + column.spacing.value) * dpmm;
      } else {
        x -= (row.size.value + row.spacing.value) * dpmm;
      }

      updateElementColor(newRect);
    });
  };

  const handlePreview = () => {
    const svgInfos = generateSvgInfo({ blockSetting, tableSetting });

    batchCmd.current.unapply();
    // to prevent layer id conflict
    layerManager.identifyLayers();

    batchCmd.current = new history.BatchCommand('Material Test Generator');

    generateBlocks(svgInfos, blockSetting, batchCmd.current);
    generateText(svgInfos, blockSetting, batchCmd.current);
  };

  const handleExport = () => {
    undoManager.addCommandToHistory(batchCmd.current);

    svgEditor.updateContextPanel();
    useLayerStore.getState().forceUpdate();

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
  }, [tableSetting, blockSetting, textSetting, blockOption]);

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
        isInch={isInch}
      />

      <TextSettingForm handleChange={setTextSetting} isInch={isInch} setting={textSetting} />
    </DraggableModal>
  );
};

export default MaterialTestGeneratorPanel;
