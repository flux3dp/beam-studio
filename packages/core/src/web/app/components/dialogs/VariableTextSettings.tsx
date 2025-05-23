import React, { useRef } from 'react';

import { DesktopOutlined, FontColorsOutlined, LeftOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, InputNumber, Row, Switch, Typography } from 'antd';
import Papa from 'papaparse';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { setVariableTextState, useVariableTextState } from '@core/app/stores/variableText';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';
import { convertVariableText } from '@core/helpers/variableText';
import dialog from '@core/implementations/dialog';

import styles from './VariableTextSettings.module.scss';

interface Props {
  onClose: () => void;
}

const fileLimit = 5 * 1024 * 1024; // 5MB
const min = 0;
const max = 1000000000;

const VariableTextSettings = ({ onClose }: Props): React.ReactNode => {
  const { alert: tAlert, variable_text_settings: t } = useI18n();
  const store = useVariableTextState();
  const bakeRef = useRef<(() => void) | null>(null);
  const [form] = Form.useForm();
  const current = Form.useWatch('current', form);
  const start = Form.useWatch('start', form);
  const end = Form.useWatch('end', form);
  const advanceBy = Form.useWatch('advanceBy', form);
  const csvFileName = Form.useWatch('csvFileName', form);

  const loadCsv = async (): Promise<void> => {
    const file = await dialog.getFileFromDialog({ filters: [{ extensions: ['csv'], name: 'Comma-separated Values' }] });

    if (!file) return;

    if (file.size > fileLimit) {
      MessageCaller.openMessage({
        content: t.file_size_exceeded,
        level: MessageLevel.ERROR,
      });

      return;
    }

    Papa.parse(file, {
      complete: (results) => {
        form.setFieldsValue({ csvContent: results.data, csvFileName: file.name });
      },
      error: () => {
        MessageCaller.openMessage({
          content: t.file_error,
          level: MessageLevel.ERROR,
        });
      },
    });
  };

  const onSave = () => {
    setVariableTextState(form.getFieldsValue());
    onClose();
  };

  return (
    <DraggableModal
      className={styles.modal}
      // Margin 28, Modal width 540
      defaultPosition={{ x: window.innerWidth - 28 - 540, y: 80 }}
      footer={
        <div className={styles.footer}>
          <div className={styles['csv-block']}>
            <b className={styles.label}>{t.csv_file}: </b>
            {csvFileName && <Typography.Text ellipsis={{ tooltip: csvFileName }}>{csvFileName}</Typography.Text>}
            <Button icon={<UploadOutlined />} onClick={loadCsv}>
              {t.browse}
            </Button>
            <Button danger onClick={() => form.setFieldsValue({ csvContent: [], csvFileName: '' })}>
              {t.clear}
            </Button>
          </div>
          <div>
            <Button onClick={onSave} type="primary">
              {tAlert.ok}
            </Button>
          </div>
        </div>
      }
      mask={false}
      onCancel={onClose}
      open
      title={t.title}
    >
      <div>{t.note}</div>
      <Form className={styles.form} form={form} initialValues={store} labelAlign="right" labelCol={{ span: 12 }}>
        <Row>
          <Col span={11}>
            <Form.Item hidden name="csvContent" />
            <Form.Item hidden name="csvFileName" />
            <Form.Item label={t.current} name="current">
              <InputNumber
                max={max}
                min={min}
                parser={(d) => Math.round(+(d || '0'))}
                precision={0}
                status={current < start || current > end ? 'warning' : ''}
              />
            </Form.Item>
            <Form.Item label={t.start} name="start">
              <InputNumber max={max - 1} min={min} parser={(d) => Math.round(+(d || '0'))} precision={0} />
            </Form.Item>
            <Form.Item label={t.end} name="end">
              <InputNumber
                max={max}
                min={start + 1}
                parser={(d) => Math.max(start + 1, Math.round(+(d || '0')))}
                precision={0}
              />
            </Form.Item>
            <Form.Item label={t.advance_by} name="advanceBy">
              <InputNumber max={max} min={1} parser={(d) => Math.round(+(d || '0'))} precision={0} />
            </Form.Item>
          </Col>
          <Col className={styles['divider-block']} span={2}>
            <Divider className={styles.divider} type="vertical" />
          </Col>
          <Col span={11}>
            <div className={styles.row}>
              <Form.Item>
                <Button
                  block
                  disabled={current - advanceBy < min}
                  icon={<LeftOutlined />}
                  onClick={() => form.setFieldValue('current', current - advanceBy)}
                >
                  {t.previous}
                </Button>
              </Form.Item>
              <Form.Item>
                <Button
                  block
                  disabled={current + advanceBy > max}
                  icon={<RightOutlined />}
                  onClick={() => form.setFieldValue('current', current + advanceBy)}
                >
                  {t.next}
                </Button>
              </Form.Item>
            </div>
            <Form.Item>
              <Button
                block
                icon={<DesktopOutlined />}
                onMouseDown={async () => {
                  bakeRef.current = await convertVariableText({ configs: form.getFieldsValue() });
                }}
                onMouseUp={() => {
                  bakeRef.current?.();
                  bakeRef.current = null;
                }}
              >
                {t.test}
              </Button>
            </Form.Item>
            <Form.Item>
              <Button
                block
                icon={<FontColorsOutlined />}
                onClick={async () => {
                  await convertVariableText({ addToHistory: true, configs: form.getFieldsValue() });
                }}
              >
                {t.bake}
              </Button>
            </Form.Item>
            <Form.Item
              className={styles.toggle}
              label={t.auto_advance}
              name="autoAdvance"
              tooltip={t.auto_advance_hint}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </DraggableModal>
  );
};

export default VariableTextSettings;

// eslint-disable-next-line reactRefresh/only-export-components
export const showVariableTextSettings = () => {
  const id = 'variable-text-settings';

  if (isIdExist(id)) return;

  addDialogComponent(id, <VariableTextSettings onClose={() => popDialogById(id)} />);
};
