/* eslint-disable ts/no-unused-vars */
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';

import { DeleteFilled, PlusCircleFilled } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, InputNumber, Space, Table } from 'antd';

import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import type { ColorConfig } from '@core/app/constants/color-constants';
import { DefaultColorConfigs } from '@core/app/constants/color-constants';
import DraggableModal from '@core/app/widgets/DraggableModal';
import Input from '@core/app/widgets/Input';
import InputKeyWrapper from '@core/app/widgets/InputKeyWrapper';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';

import AddColorConfigModal from '../dialogs/AddColorConfigModal';

const formatHexColor = (input: string): null | string => {
  const val = input.replace(/ +/, '');
  const matchHex6 = val.match(/#[0-9A-F]{6}\b/i);

  if (matchHex6) {
    return matchHex6[0].toUpperCase();
  }

  const matchHex3 = val.match(/#[0-9A-F]{3}\b/i);

  if (matchHex3) {
    return matchHex3[0].replace(/#([0-9A-F])([0-9A-F])([0-9A-F])/i, '#$1$1$2$2$3$3').toUpperCase();
  }

  const matchRGB = val.match(/(rgb)?\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\)(?!.)/i);

  if (matchRGB) {
    const rgb = matchRGB[0].match(/[0-9]{1,3},[0-9]{1,3},[0-9]{1,3}/)[0].split(',');
    let hex = (
      Number.parseInt(rgb[0], 10) * 65536 +
      Number.parseInt(rgb[1], 10) * 256 +
      Number.parseInt(rgb[2], 10)
    ).toString(16);

    if (hex === 'NaN') {
      hex = '0';
    }

    while (hex.length < 6) {
      hex = `0${hex}`;
    }

    return `#${hex}`.toUpperCase();
  }

  return null;
};

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface EditableRowProps {
  index: number;
}

interface Props {
  onClose: () => void;
}

interface EditableCellProps {
  children: React.ReactNode;
  dataIndex: keyof ColorConfig;
  editable: boolean;
  handleSave: (record: ColorConfig) => void;
  max: number;
  min: number;
  record: ColorConfig;
  title: React.ReactNode;
  unit: string;
  validator: (val: string) => string;
}

const EditableRow = ({ index, ...props }: EditableRowProps) => {
  const [form] = Form.useForm();

  return (
    <Form component={false} form={form} size="small">
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  children,
  dataIndex,
  editable,
  handleSave,
  max,
  min,
  record,
  title,
  unit,
  validator,
  ...restProps
}: EditableCellProps) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        name={dataIndex}
        rules={[
          {
            message: `${title} is required.`,
            required: true,
          },
          {
            validator: (_, value: string) => {
              if (!validator) {
                return Promise.resolve();
              }

              if (formatHexColor(value)) {
                return Promise.resolve();
              }

              return Promise.reject();
            },
          },
        ]}
        style={{ margin: 0 }}
      >
        {max ? (
          <InputNumber
            formatter={(value) => `${value} ${unit}`}
            keyboard
            max={max}
            min={min}
            onBlur={save}
            onPressEnter={save}
            parser={(value) => Number(value?.replace(unit, ''))}
            ref={inputRef}
            size="small"
          />
        ) : (
          <Input
            onBlur={(e) => {
              form.setFieldsValue({ [dataIndex]: formatHexColor(e.target.value) });
              save();
            }}
            onPressEnter={save}
            ref={inputRef}
            size="small"
            suffix={unit}
          />
        )}
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" onClick={toggleEdit} style={{ paddingRight: 24 }}>
        {children}
        &nbsp;
        {unit}
      </div>
    );
  }

  return (
    <td {...restProps}>
      <InputKeyWrapper inputRef={inputRef}>
        <div style={{ alignItems: 'center', display: 'flex' }}>
          {dataIndex === 'color' && <div className="config-color-block" style={{ background: record.color }} />}
          {childNode}
        </div>
      </InputKeyWrapper>
    </td>
  );
};

type DataType = ColorConfig & { key: React.Key };
type EditableTableProps = Parameters<typeof Table>[0];
type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

const LayerColorConfigPanel = (props: Props): React.JSX.Element => {
  const {
    beambox: { layer_color_config_panel: t },
    global: tGlobal,
  } = useI18n();
  const [displayAddPanel, setDisplayAddPanel] = useState(false);
  const { onClose } = props;

  const layerColorConfigSettings = storage.get('layer-color-config') as {
    array: ColorConfig[];
  };

  const initConfigs = layerColorConfigSettings?.array || [...DefaultColorConfigs];

  const [dataSource, setDataSource] = useState<DataType[]>(
    initConfigs.map((config) => ({
      key: config.color,
      ...config,
    })),
  );

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter((item) => item.key !== key);

    setDataSource(newData);
  };

  const handleSave = (row: DataType) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];

    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };

  const columns: Array<
    ColumnTypes[number] & {
      dataIndex: string;
      editable?: boolean;
      max?: number;
      min?: number;
      unit?: string;
      validator?: (val: string) => string;
    }
  > = [
    {
      dataIndex: 'color',
      editable: true,
      title: t.color,
      validator: (value) => formatHexColor(value) || value,
      width: '130px',
    },
    {
      dataIndex: 'speed',
      editable: true,
      max: 900,
      min: 0,
      title: t.speed,
      unit: 'mm/s',
      width: '60px',
    },
    {
      dataIndex: 'power',
      editable: true,
      max: 100,
      min: 0,
      title: t.power,
      unit: '%',
      width: '60px',
    },
    {
      dataIndex: 'repeat',
      editable: true,
      max: 999,
      min: 0,
      title: t.repeat,
      unit: '',
      width: '60px',
    },
    {
      dataIndex: 'operation',
      render: (_, record: { key: React.Key }) => (
        <Button onClick={() => handleDelete(record.key)} type="text">
          <DeleteFilled />
        </Button>
      ),
      title: '',
    },
  ].map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        ...col,
        handleSave,
      }),
    };
  });

  const hasColor = (color: string) => dataSource.some((v) => v.color === color);

  const onResetDefault = () => {
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      message: t.sure_to_reset,
      onYes: () => {
        setDataSource(
          DefaultColorConfigs.map((config) => ({
            key: config.color,
            ...config,
          })),
        );
      },
    });
  };

  const onSave = () => {
    const backwardCompatibleConfigDict: Record<string, number> = {};

    dataSource.forEach((config, index) => {
      backwardCompatibleConfigDict[config.color] = index;
    });

    const configData = { array: dataSource, dict: backwardCompatibleConfigDict };

    console.log(configData);
    storage.set('layer-color-config', configData);
    onClose();
  };

  const renderFooter = () => [
    <Button key="reset" onClick={onResetDefault} type="dashed">
      {t.default}
    </Button>,
    <Button key="cancel" onClick={onClose}>
      {tGlobal.cancel}
    </Button>,
    <Button key="save" onClick={onSave} type="primary">
      {tGlobal.save}
    </Button>,
  ];

  const handleAddConfig = (config: ColorConfig) => {
    if (!config.color) {
      Alert.popUp({
        message: t.no_input,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    } else if (hasColor(config.color)) {
      Alert.popUp({
        message: t.in_use,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    } else {
      setDataSource((prev) => [...prev, { key: config.color, ...config }]);
      setDisplayAddPanel(false);
    }
  };

  const render = () => (
    <DraggableModal footer={renderFooter()} onCancel={onClose} open title={t.layer_color_config}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button onClick={() => setDisplayAddPanel(true)} type="primary">
          <PlusCircleFilled />
          {t.add_config}
        </Button>
        <Table
          bordered
          columns={columns as ColumnTypes}
          components={{
            body: {
              cell: EditableCell,
              row: EditableRow,
            },
          }}
          dataSource={dataSource}
          pagination={{ pageSize: 8 }}
          rowClassName={() => 'editable-row'}
          size="small"
        />
        {displayAddPanel && (
          <AddColorConfigModal handleAddConfig={handleAddConfig} onClose={() => setDisplayAddPanel(false)} />
        )}
      </Space>
    </DraggableModal>
  );

  return render();
};

export default LayerColorConfigPanel;
