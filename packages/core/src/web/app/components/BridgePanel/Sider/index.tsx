import React, { memo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Switch } from 'antd';

import BridgePanelIcons from '@core/app/icons/BridgePanel/BridgePanelIcons';
import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import FullWindowPanelSider from '@core/app/widgets/FullWindowPanel/Sider';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

interface Props {
  bridgeGap: number;
  bridgeWidth: number;
  mode: 'auto' | 'manual';
  onClose: () => void;
  onComplete: () => void;
  setBridgeGap: (gap: number) => void;
  setBridgeWidth: (width: number) => void;
  setMode: (mode: 'auto' | 'manual') => void;
}

function UnmemorizedSider({
  bridgeGap,
  bridgeWidth,
  mode = 'manual',
  onClose,
  onComplete,
  setBridgeGap,
  setBridgeWidth,
  setMode,
}: Props): React.JSX.Element {
  const { buttons: langButtons } = useI18n();

  return (
    <FullWindowPanelSider className={styles.sider}>
      <Flex className={styles['h-100']} justify="space-between" vertical>
        <div>
          <BackButton onClose={onClose}>{langButtons.back_to_beam_studio}</BackButton>
          <Header icon={<BridgePanelIcons.Bridge />} title={'Bridge'} />
          <div className={styles.wrapper}>
            <Form>
              <Form.Item label={`Manual Mode:`}>
                <Switch
                  className={styles.switch}
                  onChange={(checked) => (checked ? setMode('manual') : setMode('auto'))}
                  value={mode === 'manual'}
                />
                <QuestionCircleOutlined className={styles.icon} />
              </Form.Item>
              <Form.Item label={`Width:`}>
                <UnitInput addonAfter="mm" max={10} min={0.1} onChange={setBridgeWidth as any} value={bridgeWidth} />
              </Form.Item>
              {mode === 'auto' && (
                <>
                  <Form.Item label={`Gap:`}>
                    <UnitInput addonAfter="mm" max={50} min={1} onChange={setBridgeGap as any} value={bridgeGap} />
                  </Form.Item>
                  <Button type="default">Add Bridge</Button>
                </>
              )}
            </Form>
          </div>
        </div>
        <Footer>
          <Button key="ok" onClick={onComplete} type="primary">
            {'Save and Exit'}
          </Button>
        </Footer>
      </Flex>
    </FullWindowPanelSider>
  );
}

const Sider = memo(UnmemorizedSider);

export default Sider;
