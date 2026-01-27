import type { ReactNode } from 'react';
import React, { useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Form, InputNumber, Modal, Pagination, Switch } from 'antd';

import { useBoxgenStore } from '@core/app/stores/boxgenStore';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
import importSvgString from '@core/app/svgedit/operations/import/importSvgString';
import { getLayouts } from '@core/helpers/boxgen/Layout';
import wrapSVG from '@core/helpers/boxgen/wrapSVG';
import useI18n from '@core/helpers/useI18n';
import type { IExportOptions } from '@core/interfaces/IBoxgen';

import styles from './ExportButton.module.scss';
import useBoxgenWorkarea from './useBoxgenWorkarea';

interface ExportDialogProps {
  onClose: () => void;
  setVisible: (visible: boolean) => void;
  visible: boolean;
}

const ExportDialog = ({ onClose, setVisible, visible }: ExportDialogProps): ReactNode => {
  const lang = useI18n().boxgen;
  const boxData = useBoxgenStore((state) => state.boxData);
  const { lengthUnit, workarea } = useBoxgenWorkarea();
  const { decimal, unit, unitRatio } = lengthUnit;
  const isMM = unit === 'mm';
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

    const boxLayers: string[] = [];
    const newLayers: string[] = [];

    layerManager.getAllLayers().forEach((layer) => {
      const name = layer.getName();

      if (name.startsWith('Box ')) {
        boxLayers.push(name.split('-')[0]);
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

    const elems = (await Promise.allSettled(promises))
      .map((p) => (p.status === 'fulfilled' ? p.value : null))
      .filter(Boolean);

    await disassembleUse(elems, { parentCmd: batchCmd, showProgress: false, skipConfirm: true });
    newLayers.slice(options.textLabel ? 2 : 1).forEach((layerName) => {
      const layerObject = layerManager.getLayerByName(layerName);

      layerObject?.setVisible(false, { addToHistory: false });
    });
    undoManager.addCommandToHistory(batchCmd);
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

interface ExportButtonProps {
  onClose: () => void;
}

const ExportButton = ({ onClose }: ExportButtonProps): React.JSX.Element => {
  const lang = useI18n().boxgen;
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onClick={() => setVisible(true)} type="primary">
        {lang.continue_import}
      </Button>
      <ExportDialog onClose={onClose} setVisible={setVisible} visible={visible} />
    </>
  );
};

export default ExportButton;
