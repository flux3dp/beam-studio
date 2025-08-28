import React, { useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Switch, Tooltip } from 'antd';
import Konva from 'konva';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import { useStampMakerPanelStore } from '../../store';

import styles from './Content.module.scss';

export default function Content(): React.JSX.Element {
  const { stamp_maker_panel } = useI18n();
  const { bevelRadius, filters, horizontalFlip, setBevelRadius, setHorizontalFlip, toggleInvert } =
    useStampMakerPanelStore();
  const isInverted = useMemo(() => filters.includes(Konva.Filters.Invert), [filters]);

  const handleToggleFlip = () => setHorizontalFlip(!horizontalFlip);

  return (
    <div className={styles.wrapper}>
      <Form layout="horizontal">
        <Form.Item label={stamp_maker_panel.invert}>
          <Flex align="center" gap={8}>
            <Switch checked={isInverted} onChange={toggleInvert} />
            <Tooltip title={stamp_maker_panel.tool_tip.invert}>
              <QuestionCircleOutlined className={styles['tool-tip']} />
            </Tooltip>
          </Flex>
        </Form.Item>
        <Form.Item label={stamp_maker_panel.horizontal_flip}>
          <Flex align="center" gap={8}>
            <Switch checked={horizontalFlip} onChange={handleToggleFlip} />
            <Tooltip title={stamp_maker_panel.tool_tip.horizontal_flip}>
              <QuestionCircleOutlined className={styles['tool-tip']} />
            </Tooltip>
          </Flex>
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
