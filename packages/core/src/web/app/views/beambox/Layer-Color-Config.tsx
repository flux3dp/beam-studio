/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { Button, Form, FormInstance, InputNumber, Modal, Space, Table } from 'antd';
import { DeleteFilled, PlusCircleFilled } from '@ant-design/icons';
import { useContext, useEffect, useRef, useState } from 'react';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import Input from 'app/widgets/Input';
import InputKeyWrapper from 'app/widgets/InputKeyWrapper';
import storage from 'implementations/storage';
import useI18n from 'helpers/useI18n';
import { ColorConfig, DefaultColorConfigs } from 'app/constants/color-constants';

import AddColorConfigModal from '../dialogs/AddColorConfigModal';

const formatHexColor = (input: string): string | null => {
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
      parseInt(rgb[0], 10) * 65536 +
      parseInt(rgb[1], 10) * 256 +
      parseInt(rgb[2], 10)
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
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof ColorConfig;
  record: ColorConfig;
  unit: string;
  min: number;
  max: number;
  validator: (val: string) => string;
  handleSave: (record: ColorConfig) => void;
}

const EditableRow = ({ index, ...props }: EditableRowProps) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false} size="small">
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  unit,
  min,
  max,
  record,
  validator,
  handleSave,
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
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
          {
            validator: (_, value: string) => {
              if (!validator) return Promise.resolve();
              if (formatHexColor(value)) {
                return Promise.resolve();
              }
              return Promise.reject();
            },
          },
        ]}
      >
        {max ? (
          <InputNumber
            size="small"
            ref={inputRef}
            keyboard
            onPressEnter={save}
            onBlur={save}
            min={min}
            max={max}
            formatter={(value) => `${value} ${unit}`}
            parser={(value) => Number(value?.replace(unit, ''))}
          />
        ) : (
          <Input
            size="small"
            ref={inputRef}
            onPressEnter={save}
            onBlur={(e) => {
              form.setFieldsValue({ [dataIndex]: formatHexColor(e.target.value) });
              save();
            }}
            suffix={unit}
          />
        )}
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
        {children}
        &nbsp;
        {unit}
      </div>
    );
  }

  return (
    <td {...restProps}>
      <InputKeyWrapper inputRef={inputRef}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {dataIndex === 'color' && (
            <div style={{ background: record.color }} className="config-color-block" />
          )}
          {childNode}
        </div>
      </InputKeyWrapper>
    </td>
  );
};

type DataType = ColorConfig & { key: React.Key };
type EditableTableProps = Parameters<typeof Table>[0];
type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

const LayerColorConfigPanel = (props: Props): JSX.Element => {
  const {
    global: tGlobal,
    beambox: { layer_color_config_panel: t },
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
    }))
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

  const columns: (ColumnTypes[number] & {
    editable?: boolean;
    dataIndex: string;
    unit?: string;
    min?: number;
    max?: number;
    validator?: (val: string) => string;
  })[] = [
    {
      title: t.color,
      dataIndex: 'color',
      editable: true,
      validator: (value) => formatHexColor(value) || value,
      width: '130px',
    },
    {
      title: t.speed,
      dataIndex: 'speed',
      editable: true,
      min: 0,
      max: 900,
      unit: 'mm/s',
      width: '60px',
    },
    {
      title: t.power,
      dataIndex: 'power',
      editable: true,
      min: 0,
      max: 100,
      unit: '%',
      width: '60px',
    },
    {
      title: t.repeat,
      dataIndex: 'repeat',
      editable: true,
      min: 0,
      max: 999,
      unit: '',
      width: '60px',
    },
    {
      title: '',
      dataIndex: 'operation',
      render: (_, record: { key: React.Key }) => (
        <Button type="text" onClick={() => handleDelete(record.key)}>
          <DeleteFilled />
        </Button>
      ),
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
          }))
        );
      },
    });
  };

  const onSave = () => {
    const backwardCompatibleConfigDict = {};
    dataSource.forEach((config, index) => {
      backwardCompatibleConfigDict[config.color] = index;
    });
    const configData = { array: dataSource, dict: backwardCompatibleConfigDict };
    console.log(configData);
    storage.set('layer-color-config', configData);
    onClose();
  };

  const renderFooter = () => [
    <Button key="reset" type="dashed" onClick={onResetDefault}>
      {t.default}
    </Button>,
    <Button key="cancel" onClick={onClose}>
      {tGlobal.cancel}
    </Button>,
    <Button key="save" type="primary" onClick={onSave}>
      {tGlobal.save}
    </Button>,
  ];

  const handleAddConfig = (config: ColorConfig) => {
    if (!config.color) {
      Alert.popUp({
        type: AlertConstants.SHOW_POPUP_ERROR,
        message: t.no_input,
      });
    } else if (hasColor(config.color)) {
      Alert.popUp({
        type: AlertConstants.SHOW_POPUP_ERROR,
        message: t.in_use,
      });
    } else {
      setDataSource((prev) => [...prev, { key: config.color, ...config }]);
      setDisplayAddPanel(false);
    }
  };

  const render = () => (
    <Modal open centered onCancel={onClose} title={t.layer_color_config} footer={renderFooter()}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" onClick={() => setDisplayAddPanel(true)}>
          <PlusCircleFilled />
          {t.add_config}
        </Button>
        <Table
          pagination={{ pageSize: 8 }}
          size="small"
          components={{
            body: {
              row: EditableRow,
              cell: EditableCell,
            },
          }}
          rowClassName={() => 'editable-row'}
          bordered
          dataSource={dataSource}
          columns={columns as ColumnTypes}
        />
        {displayAddPanel && (
          <AddColorConfigModal
            onClose={() => setDisplayAddPanel(false)}
            handleAddConfig={handleAddConfig}
          />
        )}
      </Space>
    </Modal>
  );
  return render();
};

export default LayerColorConfigPanel;
