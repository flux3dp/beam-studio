import React, { useContext, useMemo, useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Form, InputNumber, Modal, Pagination, Switch } from 'antd';

import { BoxgenContext } from '@core/app/contexts/BoxgenContext';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import importSvgString from '@core/app/svgedit/operations/import/importSvgString';
import { getLayouts } from '@core/helpers/boxgen/Layout';
import wrapSVG from '@core/helpers/boxgen/wrapSVG';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type { IExportOptions } from '@core/interfaces/IBoxgen';
import type ISVGLayer from '@core/interfaces/ISVGLayer';

import styles from './ExportButton.module.scss';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const ExportDialog = ({
  setVisible,
  visible,
}: {
  setVisible: (visible: boolean) => void;
  visible: boolean;
}): React.JSX.Element => {
  const lang = useI18n().boxgen;
  const { boxData, lengthUnit, onClose, workarea } = useContext(BoxgenContext);
  const { decimal, unit, unitRatio } = lengthUnit;
  const isMM = useMemo(() => unit === 'mm', [unit]);
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState<IExportOptions>({
    compRadius: 0.1,
    joinOutput: false,
    textLabel: false,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  if (!visible) {
    return null;
  }

  const { canvasHeight, canvasWidth } = workarea;
  const layouts = getLayouts(canvasWidth, canvasHeight, boxData, options);

  const handleOk = async () => {
    setConfirmLoading(true);

    const boxLayers = [];
    const newLayers = [];
    const drawing = svgCanvas.getCurrentDrawing();

    (drawing.all_layers as ISVGLayer[]).forEach((layer) => {
      if (layer.name_.startsWith('Box ')) {
        boxLayers.push(layer.name_.split('-')[0]);
      }
    });

    let i = 0;
    let uniqBoxName = '';

    do {
      i += 1;
      uniqBoxName = `Box ${i}`;
    } while (boxLayers.includes(uniqBoxName));

    const batchCmd = HistoryCommandFactory.createBatchCommand('Import box layer');
    const promises: Array<Promise<SVGUseElement>> = [];

    layouts.pages.forEach((pageContent, idx) => {
      let content = wrapSVG(canvasWidth, canvasHeight, pageContent.shape);

      promises.push(
        importSvgString(content, {
          layerName: `${uniqBoxName}-${idx + 1}`,
          parentCmd: batchCmd,
          type: 'layer',
        }),
      );
      newLayers.push(`${uniqBoxName}-${idx + 1}`);

      if (options.textLabel) {
        content = wrapSVG(canvasWidth, canvasHeight, pageContent.label);
        promises.push(
          importSvgString(content, {
            layerName: `${uniqBoxName}-${idx + 1} Label`,
            parentCmd: batchCmd,
            type: 'layer',
          }),
        );
        newLayers.push(`${uniqBoxName}-${idx + 1} Label`);
      }
    });

    const elems = (await Promise.allSettled(promises)).map((p) => (p.status === 'fulfilled' ? p.value : null));

    batchCmd.addSubCommand(await svgCanvas.disassembleUse2Group(elems, true, false, false));
    newLayers.slice(options.textLabel ? 2 : 1).forEach((layername) => drawing.setLayerVisibility(layername, false));
    svgCanvas.addCommandToHistory(batchCmd);
    setConfirmLoading(false);
    setVisible(false);
    onClose();
  };

  return (
    <Modal
      cancelText={lang.cancel}
      centered
      confirmLoading={confirmLoading}
      okButtonProps={{ icon: <DownloadOutlined /> }}
      okText={lang.import}
      onCancel={() => setVisible(false)}
      onOk={handleOk}
      open={visible}
      title={lang.import}
    >
      <svg height={250} viewBox={`-0.5 -0.5 ${canvasWidth + 0.5} ${canvasHeight + 0.5}`} width="100%">
        <rect
          height={canvasHeight}
          style={{
            fill: 'none',
            stroke: '#CCC',
            strokeDasharray: 4,
            strokeWidth: 1,
          }}
          width={canvasWidth}
          x={0}
          y={0}
        />
        {layouts.pages[page - 1].shape}
        {layouts.pages[page - 1].label}
      </svg>
      <Pagination
        className={styles.pagination}
        current={page}
        defaultPageSize={1}
        onChange={(value) => setPage(value)}
        total={layouts.pages.length}
      />
      <div className={styles['form-title']}>{lang.customize}</div>
      <Form
        className={styles.form}
        initialValues={options}
        onValuesChange={(values) => {
          setOptions({ ...options, ...values });
          setPage(1);
        }}
      >
        <Form.Item className={styles['form-item']} label={lang.merge} name="joinOutput" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item className={styles['form-item']} label={lang.text_label} name="textLabel" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item
          className={styles['form-item']}
          label={lang.beam_radius}
          name="compRadius"
          tooltip={lang.beam_radius_warning}
        >
          <InputNumber<number>
            addonAfter={unit}
            formatter={(v, { input, userTyping }) =>
              userTyping ? input : ((v as number) / unitRatio).toFixed(decimal + 2)
            }
            max={isMM ? 0.3 : 0.3048}
            min={0}
            parser={(v) => Number(v) * unitRatio}
            size="small"
            step={isMM ? 0.1 : 0.001 * unitRatio}
            type="number"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ExportButton = (): React.JSX.Element => {
  const lang = useI18n().boxgen;
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onClick={() => setVisible(true)} type="primary">
        {lang.continue_import}
      </Button>
      <ExportDialog setVisible={setVisible} visible={visible} />
    </>
  );
};

export default ExportButton;
