import React, { useEffect, useMemo, useState } from 'react';

import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Form, InputNumber, Radio, Slider, Space, Switch, Tooltip } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import { round } from 'remeda';
import { sprintf } from 'sprintf-js';

import {
  SCREW_LENGTH_INCH,
  SCREW_LENGTH_MM,
  SCREW_SIZE_INCH,
  SCREW_SIZE_MM,
  SHEET_THICKNESS_INCH,
  SHEET_THICKNESS_MM,
} from '@core/app/constants/boxgen-constants';
import { useBoxgenStore } from '@core/app/stores/boxgenStore';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';
import type { IController } from '@core/interfaces/IBoxgen';

import styles from './Controller.module.scss';
import type { LengthUnit } from './useBoxgenWorkarea';
import useBoxgenWorkarea from './useBoxgenWorkarea';

const LengthInputItem = ({
  className,
  hidden,
  label,
  lengthUnit,
  max,
  min = 0,
  name,
  step = 1,
}: {
  className?: string;
  hidden?: boolean;
  label: string;
  lengthUnit: LengthUnit;
  max?: number;
  min?: number;
  name: string;
  step?: number;
}) => {
  const { decimal, unit, unitRatio } = lengthUnit;

  return (
    <Form.Item className={className} hidden={hidden} label={label} name={name}>
      <InputNumber
        addonAfter={unit}
        className={styles['number-input']}
        formatter={(v, { input, userTyping }) => (userTyping ? input : ((v as number) / unitRatio).toFixed(decimal))}
        max={max}
        min={min}
        parser={(v) => Number(v) * unitRatio}
        step={step * unitRatio}
        type="number"
      />
    </Form.Item>
  );
};

const Controller = (): React.JSX.Element => {
  const lang = useI18n().boxgen;
  const { boxData, setBoxData } = useBoxgenStore();
  const { lengthUnit, workarea } = useBoxgenWorkarea();
  const longSideLimit = Math.max(workarea.canvasWidth, workarea.canvasHeight);
  const shortSideLimit = Math.min(workarea.canvasWidth, workarea.canvasHeight);
  const { decimal, unit, unitRatio } = lengthUnit;
  const isMM = unit === 'mm';

  const [customThickness, setCustomThickness] = useState(0);
  const [thicknessOptions, setOptions] = useState<DefaultOptionType[]>([]);
  const [jointWarning, setJointWarning] = useState<string | undefined>(undefined);
  const canAddCustomThickness = useMemo(() => {
    if (customThickness <= 0) return false;

    return !thicknessOptions.some((option) => option.value === round(customThickness * unitRatio, 3));
  }, [customThickness, thicknessOptions, unitRatio]);

  const screwSizes = isMM ? SCREW_SIZE_MM : SCREW_SIZE_INCH;
  const screwLens = isMM ? SCREW_LENGTH_MM : SCREW_LENGTH_INCH;

  useEffect(() => {
    setOptions(isMM ? SHEET_THICKNESS_MM : SHEET_THICKNESS_INCH);
  }, [isMM]);

  const maxTSlotCount = useMemo(
    () => Math.floor(Math.min(boxData.width, boxData.height, boxData.depth) / 30),
    [boxData],
  );
  const maxTeethLength = useMemo(
    () => Math.min(boxData.width, boxData.height, boxData.depth) - boxData.sheetThickness * 2 - 5,
    [boxData],
  );

  const [form] = Form.useForm();

  const onValuesChange = (): void => {
    setJointWarning(undefined);

    const fields: IController = form.getFieldsValue(true);
    let { depth, height, joint, teethLength, tSlotCount, width } = fields;
    const innerSizeInflation: number = fields.volume === 'inner' ? fields.sheetThickness * 2 : 0;

    width += innerSizeInflation;
    height += innerSizeInflation;
    depth += innerSizeInflation;

    if (joint === 't-slot') {
      if (maxTSlotCount < 1) {
        joint = 'edge';
        form.setFieldValue('joint', joint);
        setJointWarning(lang.tSlot_warning);
      } else {
        tSlotCount = Math.min(Math.max(tSlotCount, 1), maxTSlotCount);
        form.setFieldValue('tSlotCount', tSlotCount);
        teethLength = Math.min(width, height, depth) / (tSlotCount * 2 + 1);
        form.setFieldValue('teethLength', teethLength);
      }
    } else if (joint === 'finger') {
      if (maxTeethLength < 1) {
        joint = 'edge';
        form.setFieldValue('joint', joint);
        setJointWarning(lang.finger_warning);
      } else {
        teethLength = Math.min(teethLength, maxTeethLength);
        form.setFieldValue('teethLength', teethLength);
      }
    }

    if (joint === 'edge') {
      teethLength = Math.max(width, height, depth);
    }

    const newData = {
      ...fields,
      depth,
      height,
      joint,
      teethLength,
      tSlotCount,
      width,
    };

    setBoxData(newData);
  };

  useEffect(() => {
    const { joint, tSlotCount }: IController = form.getFieldsValue(true);

    if (joint === 't-slot' && (maxTSlotCount < 1 || tSlotCount > maxTSlotCount)) {
      onValuesChange();
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [maxTSlotCount]);

  useEffect(() => {
    const { joint, teethLength }: IController = form.getFieldsValue(true);

    if (joint === 'finger' && (maxTeethLength < 1 || teethLength > maxTeethLength)) {
      onValuesChange();
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [maxTeethLength]);

  const addThicknessOptions = () => {
    if (!canAddCustomThickness) return;

    setOptions([
      ...thicknessOptions,
      {
        label: `${+customThickness.toFixed(decimal)} ${unit}`,
        value: round(customThickness * unitRatio, 3),
      },
    ]);
  };

  return (
    <div className={styles.controller}>
      <div className={styles.workarea}>
        <Tooltip
          arrow={{ pointAtCenter: true }}
          placement="bottomLeft"
          title={sprintf(
            lang.max_dimension_tooltip,
            `${(longSideLimit / unitRatio).toFixed(isMM ? 0 : 2)}${unit}`,
            `${(shortSideLimit / unitRatio).toFixed(isMM ? 0 : 2)}${unit}`,
          )}
        >
          <QuestionCircleOutlined className={styles.icon} />
        </Tooltip>
        <span>
          {lang.workarea} : {workarea.label} ( {(workarea.canvasWidth / unitRatio).toFixed(isMM ? 0 : 2)} x{' '}
          {(workarea.canvasHeight / unitRatio).toFixed(isMM ? 0 : 2)} {unit}
          <sup>2</sup> )
        </span>
      </div>
      <Form
        className={styles.form}
        form={form}
        initialValues={boxData}
        labelCol={{ span: 8 }}
        layout="horizontal"
        onValuesChange={onValuesChange}
      >
        <Form.Item label={lang.volume} name="volume">
          <Radio.Group>
            <Radio.Button value="outer">{lang.outer}</Radio.Button>
            <Radio.Button value="inner">{lang.inner}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label={lang.cover} name="cover" valuePropName="checked">
          <Switch />
        </Form.Item>
        <LengthInputItem
          className={styles['small-margin']}
          label={lang.width}
          lengthUnit={lengthUnit}
          max={longSideLimit}
          min={1}
          name="width"
        />
        <LengthInputItem
          className={styles['small-margin']}
          label={lang.height}
          lengthUnit={lengthUnit}
          max={shortSideLimit}
          min={1}
          name="height"
        />
        <LengthInputItem label={lang.depth} lengthUnit={lengthUnit} max={shortSideLimit} min={1} name="depth" />
        <Form.Item label={lang.thickness} name="sheetThickness">
          <Select
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider className={styles.divider} />
                <Space className={styles['thickness-editor']} onKeyDown={(e) => e.stopPropagation()}>
                  <InputNumber<number>
                    addonAfter={unit}
                    defaultValue={customThickness}
                    min={0}
                    onChange={(v) => {
                      if (v !== null) setCustomThickness(v);
                    }}
                    onPressEnter={addThicknessOptions}
                    type="number"
                    width={60}
                  />
                  <Button
                    disabled={!canAddCustomThickness}
                    icon={<PlusOutlined />}
                    onClick={addThicknessOptions}
                    type="text"
                  >
                    {lang.add_option}
                  </Button>
                </Space>
              </>
            )}
            options={thicknessOptions}
            popupMatchSelectWidth={false}
          />
        </Form.Item>
        <Form.Item
          help={jointWarning}
          label={lang.joints}
          name="joint"
          validateStatus={jointWarning ? 'warning' : undefined}
        >
          <Select
            options={[
              { label: lang.edge, value: 'edge' },
              { disabled: maxTeethLength < 1, label: lang.finger, value: 'finger' },
              { disabled: maxTSlotCount < 1, label: lang.tSlot, value: 't-slot' },
            ]}
          />
        </Form.Item>

        <Form.Item
          className={styles['teeth-length']}
          hidden={boxData.joint !== 'finger'}
          label={lang.finger}
          name="teethLength"
        >
          <Form.Item className={styles['no-margin']} name="teethLength">
            <Slider
              max={maxTeethLength}
              min={maxTeethLength === 1 ? 0 : 1}
              step={0.1 * unitRatio}
              tooltip={{
                formatter: (val?: number) => (val! / unitRatio).toFixed(decimal + 1),
              }}
            />
          </Form.Item>
          <LengthInputItem
            className={styles['no-margin']}
            hidden={boxData.joint !== 'finger'}
            label=""
            lengthUnit={lengthUnit}
            max={maxTeethLength}
            min={1}
            name="teethLength"
            step={0.1}
          />
        </Form.Item>

        <Form.Item
          hidden={boxData.joint !== 't-slot'}
          label={lang.tCount}
          name="tSlotCount"
          tooltip={lang.tCount_tooltip}
        >
          <Slider disabled={maxTSlotCount === 1} max={maxTSlotCount} min={maxTSlotCount === 1 ? 0 : 1} step={1} />
        </Form.Item>
        <Form.Item hidden={boxData.joint !== 't-slot'} label={lang.tDiameter} name="tSlotDiameter">
          <Select options={screwSizes} />
        </Form.Item>
        <Form.Item hidden={boxData.joint !== 't-slot'} label={lang.tLength} name="tSlotLength">
          <Select options={screwLens} />
        </Form.Item>
      </Form>
    </div>
  );
};

export default Controller;
