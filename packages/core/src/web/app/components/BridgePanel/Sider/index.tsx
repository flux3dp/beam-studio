import type { Dispatch, SetStateAction } from 'react';
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
  handleCutPathByGap: () => void;
  mode: 'auto' | 'manual';
  onClose: () => void;
  onComplete: () => void;
  setBridgeGap: Dispatch<SetStateAction<number>>;
  setBridgeWidth: Dispatch<SetStateAction<number>>;
  setMode: Dispatch<SetStateAction<'auto' | 'manual'>>;
}

function UnmemorizedSider({
  bridgeGap,
  bridgeWidth,
  handleCutPathByGap,
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
                <>
                  <Switch
                    className={styles.switch}
                    onChange={(checked) => setMode(checked ? 'manual' : 'auto')}
                    value={mode === 'manual'}
                  />
                  <QuestionCircleOutlined className={styles.icon} />
                </>
              </Form.Item>
              <Form.Item hidden={mode !== 'manual'} label={`Width:`}>
                <UnitInput
                  addonAfter="mm"
                  data-testid="bridge-width"
                  isInch={false}
                  key="bridge-width"
                  max={10}
                  min={0.1}
                  onChange={(value) => setBridgeWidth(value!)}
                  precision={1}
                  step={1}
                  type="number"
                  value={bridgeWidth}
                />
              </Form.Item>
              <Form.Item hidden={mode !== 'auto'} label={`Gap:`}>
                <UnitInput
                  addonAfter="mm"
                  data-testid="bridge-gap"
                  isInch={false}
                  key="bridge-gap"
                  max={50}
                  min={1}
                  onChange={(value) => setBridgeGap(value!)}
                  precision={1}
                  step={1}
                  value={bridgeGap}
                />
              </Form.Item>
              <Button hidden={mode !== 'auto'} onClick={handleCutPathByGap} type="default">
                Add Bridge
              </Button>
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
