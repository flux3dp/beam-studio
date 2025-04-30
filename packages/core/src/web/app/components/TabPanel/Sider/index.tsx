import type { Dispatch, SetStateAction } from 'react';
import React, { memo } from 'react';

import { Button, Flex, Form, Switch } from 'antd';

import TabPanelIcons from '@core/app/icons/TabPanel/TabPanelIcons';
import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import FullWindowPanelSider from '@core/app/widgets/FullWindowPanel/Sider';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './index.module.scss';

interface Props {
  gap: number;
  handleCutPathByGap: () => void;
  mode: 'auto' | 'manual';
  onClose: () => void;
  onComplete: () => void;
  setGap: Dispatch<SetStateAction<number>>;
  setMode: Dispatch<SetStateAction<'auto' | 'manual'>>;
  setWidth: Dispatch<SetStateAction<number>>;
  width: number;
}

function UnmemorizedSider({
  gap,
  handleCutPathByGap,
  mode = 'manual',
  onClose,
  onComplete,
  setGap,
  setMode,
  setWidth,
  width,
}: Props): React.JSX.Element {
  const { alert, buttons: langButtons, global, tab_panel: tabPanel } = useI18n();

  return (
    <FullWindowPanelSider className={styles.sider}>
      <Flex className={styles['h-100']} justify="space-between" vertical>
        <div>
          <BackButton onClose={onClose}>{langButtons.back_to_beam_studio}</BackButton>
          <Header icon={<TabPanelIcons.Tab />} title={tabPanel.title} />
          <div className={styles.wrapper}>
            <div className={styles.link} onClick={() => browser.open(tabPanel.help_center)}>
              {alert.learn_more}
            </div>
            <Form>
              <Form.Item label={`${tabPanel.manual_mode}:`}>
                <Switch
                  className={styles.switch}
                  onChange={(checked) => setMode(checked ? 'manual' : 'auto')}
                  value={mode === 'manual'}
                />
              </Form.Item>
              <Form.Item label={`${tabPanel.width}:`}>
                <UnitInput
                  addonAfter="mm"
                  changeOnWheel
                  fireOnChange
                  isInch={false}
                  key="width"
                  max={10}
                  min={0.1}
                  onChange={(value) => setWidth(value!)}
                  precision={1}
                  step={0.1}
                  type="number"
                  value={width}
                />
              </Form.Item>
              <Form.Item hidden={mode !== 'auto'} label={`${tabPanel.gap}:`}>
                <UnitInput
                  addonAfter="mm"
                  changeOnWheel
                  fireOnChange
                  isInch={false}
                  key="gap"
                  max={100}
                  min={1}
                  onChange={(value) => setGap(value!)}
                  precision={1}
                  step={1}
                  value={gap}
                />
              </Form.Item>
              <Button hidden={mode !== 'auto'} onClick={handleCutPathByGap} type="default">
                {tabPanel.apply}
              </Button>
            </Form>
          </div>
        </div>
        <Footer>
          <Button key="ok" onClick={onComplete} type="primary">
            {global.save_and_exit}
          </Button>
        </Footer>
      </Flex>
    </FullWindowPanelSider>
  );
}

const Sider = memo(UnmemorizedSider);

export default Sider;
