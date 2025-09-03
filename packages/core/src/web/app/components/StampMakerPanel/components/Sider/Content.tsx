import React, { useMemo } from 'react';

import { Flex, Form, Switch } from 'antd';
import Konva from 'konva';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

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
        <div className={styles.link} onClick={() => browser.open(stamp_maker_panel.how_to.url)}>
          {stamp_maker_panel.how_to.text}
        </div>
        <Form.Item label={stamp_maker_panel.invert}>
          <Flex align="center" gap={8}>
            <Switch checked={isInverted} onChange={toggleInvert} />
          </Flex>
        </Form.Item>
        <Form.Item label={stamp_maker_panel.horizontal_flip}>
          <Flex align="center" gap={8}>
            <Switch checked={horizontalFlip} onChange={handleToggleFlip} />
          </Flex>
        </Form.Item>
        <Form.Item label={stamp_maker_panel.bevel_radius} layout="vertical">
          <Flex justify="space-between">
            <UnitInput
              addonAfter="mm"
              max={10}
              min={0}
              onChange={(value) => {
                if (value !== null) {
                  setBevelRadius(value);
                }
              }}
              precision={1}
              step={0.1}
              value={bevelRadius}
            />
          </Flex>
        </Form.Item>
      </Form>
    </div>
  );
}
