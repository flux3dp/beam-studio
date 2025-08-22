import React, { useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Switch } from 'antd';
import Konva from 'konva';
import { match } from 'ts-pattern';

import UnitInput from '@core/app/widgets/UnitInput';

import { useStampMakerPanelStore } from '../../store';
import { getEDTFilter } from '../../utils/getEDTFilter';

import styles from './Content.module.scss';

export default function Content(): React.JSX.Element {
  const { addFilter, bevelRadius, filters, horizontalFlip, removeFilter, setBevelRadius, setHorizontalFlip } =
    useStampMakerPanelStore();
  const isInverted = useMemo(() => filters.includes(Konva.Filters.Invert), [filters]);

  const handleToggleFlip = () => setHorizontalFlip(!horizontalFlip);
  const handleToggleInvert = () =>
    match(isInverted)
      .with(true, () => removeFilter(Konva.Filters.Invert))
      .otherwise(() => addFilter(Konva.Filters.Invert));
  const handleBevelRadiusChange = (bevelRadius: number) => {
    setBevelRadius(bevelRadius, getEDTFilter({ rampWidth: bevelRadius }));
  };

  return (
    <div className={styles.wrapper}>
      <Form layout="horizontal">
        <Form.Item
          label="Invert"
          tooltip={{ icon: <QuestionCircleOutlined />, title: 'Invert the colors of the image.' }}
        >
          <Switch checked={isInverted} onChange={handleToggleInvert} />
        </Form.Item>
        <Form.Item
          label="Flip Horizontally: "
          tooltip={{ icon: <QuestionCircleOutlined />, title: 'Flip the image horizontally (mirror effect).' }}
        >
          <Switch checked={horizontalFlip} onChange={handleToggleFlip} />
        </Form.Item>
        <Form.Item label={`Bevel Radius:`} layout="vertical">
          <Flex justify="space-between">
            <UnitInput
              //
              addonAfter="mm"
              max={10}
              min={0}
              onChange={(value) => {
                if (value !== null) {
                  handleBevelRadiusChange(value);
                }
              }}
              step={0.1}
              value={bevelRadius}
            />
          </Flex>
        </Form.Item>
      </Form>
    </div>
  );
}
