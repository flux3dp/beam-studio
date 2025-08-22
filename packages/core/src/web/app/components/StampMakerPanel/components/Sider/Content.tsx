import React, { useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Switch } from 'antd';
import Konva from 'konva';
import { match } from 'ts-pattern';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import { useStampMakerPanelStore } from '../../store';

import styles from './Content.module.scss';

export default function Content(): React.JSX.Element {
  const { stamp_maker_panel } = useI18n();
  const { addFilter, bevelRadius, filters, horizontalFlip, removeFilter, setBevelRadius, setHorizontalFlip } =
    useStampMakerPanelStore();
  const isInverted = useMemo(() => filters.includes(Konva.Filters.Invert), [filters]);

  const handleToggleFlip = () => setHorizontalFlip(!horizontalFlip);
  const handleToggleInvert = () =>
    match(isInverted)
      .with(true, () => removeFilter(Konva.Filters.Invert))
      .otherwise(() => addFilter(Konva.Filters.Invert, true));

  return (
    <div className={styles.wrapper}>
      <Form layout="horizontal">
        <Form.Item
          label={stamp_maker_panel.invert}
          tooltip={{ icon: <QuestionCircleOutlined />, title: stamp_maker_panel.tool_tip.invert }}
        >
          <Switch checked={isInverted} onChange={handleToggleInvert} />
        </Form.Item>
        <Form.Item
          label={stamp_maker_panel.horizontal_flip}
          tooltip={{ icon: <QuestionCircleOutlined />, title: stamp_maker_panel.tool_tip.horizontal_flip }}
        >
          <Switch checked={horizontalFlip} onChange={handleToggleFlip} />
        </Form.Item>
        <Form.Item label={stamp_maker_panel.bevel_radius} layout="vertical">
          <Flex justify="space-between">
            <UnitInput
              //
              addonAfter="mm"
              max={10}
              min={0}
              onChange={(value) => {
                if (value !== null) {
                  setBevelRadius(value);
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
