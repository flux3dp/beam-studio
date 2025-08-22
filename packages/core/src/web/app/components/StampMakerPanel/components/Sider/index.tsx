import React, { memo } from 'react';

import { Button, ConfigProvider, Flex } from 'antd';

import ImageEditPanelIcons from '@core/app/icons/image-edit-panel/ImageEditPanelIcons';
import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import FullWindowPanelSider from '@core/app/widgets/FullWindowPanel/Sider';
import useI18n from '@core/helpers/useI18n';

import Content from './Content';
import styles from './index.module.scss';

interface Props {
  handleComplete: () => void;
  onClose: () => void;
}

function Sider({ handleComplete, onClose }: Props): React.JSX.Element {
  const { buttons: langButtons, global: langGlobal, image_edit_panel: lang } = useI18n();

  return (
    <ConfigProvider theme={{ components: { InputNumber: { controlWidth: 80 } } }}>
      <FullWindowPanelSider className={styles.sider}>
        <Flex className={styles['h-100']} justify="space-between" vertical>
          <div>
            <BackButton onClose={onClose}>{langButtons.back_to_beam_studio}</BackButton>
            <Header icon={<ImageEditPanelIcons.EditImage />} title={lang.title} />
            <Content />
          </div>
          <Footer>
            <Button key="ok" onClick={handleComplete} type="primary">
              {langGlobal.ok}
            </Button>
          </Footer>
        </Flex>
      </FullWindowPanelSider>
    </ConfigProvider>
  );
}

const MemorizedSider = memo(Sider);

export default MemorizedSider;
