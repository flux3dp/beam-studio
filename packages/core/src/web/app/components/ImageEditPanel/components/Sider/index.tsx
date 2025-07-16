import React, { memo } from 'react';

import type { TabPaneProps } from 'antd';
import { Button, Flex, Tabs } from 'antd';

import ImageEditPanelIcons from '@core/app/icons/image-edit-panel/ImageEditPanelIcons';
import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import FullWindowPanelSider from '@core/app/widgets/FullWindowPanel/Sider';
import useI18n from '@core/helpers/useI18n';

import CornerRadius from './CornerRadius';
import Eraser from './Eraser';
import styles from './index.module.scss';
import MagicWand from './MagicWand';

export type Mode = 'cornerRadius' | 'eraser' | 'magicWand';

interface Props {
  handleComplete: () => void;
  mode: Mode;
  onClose: () => void;
  setMode: (mode: Mode) => void;
  setOperation: (operation: 'drag' | 'eraser' | 'magicWand' | null) => void;
}

interface Tab extends Omit<TabPaneProps, 'tab'> {
  key: string;
  label: React.ReactNode;
}

function Sider({ handleComplete, mode, onClose, setMode, setOperation }: Props): React.JSX.Element {
  const { buttons: langButtons, global: langGlobal, image_edit_panel: lang } = useI18n();

  const tabItems: Tab[] = [
    {
      children: <Eraser />,
      icon: <ImageEditPanelIcons.Eraser className={styles.icon} />,
      key: 'eraser',
      label: '',
    },
    {
      children: <MagicWand />,
      icon: <ImageEditPanelIcons.MagicWand className={styles.icon} />,
      key: 'magicWand',
      label: '',
    },
    {
      children: <CornerRadius />,
      icon: <ImageEditPanelIcons.CornerRadius className={styles.icon} />,
      key: 'cornerRadius',
      label: '',
    },
  ];

  return (
    <FullWindowPanelSider className={styles.sider}>
      <Flex className={styles['h-100']} justify="space-between" vertical>
        <div>
          <BackButton onClose={onClose}>{langButtons.back_to_beam_studio}</BackButton>
          <Header icon={<ImageEditPanelIcons.EditImage />} title={lang.title} />
          <Tabs
            activeKey={mode}
            centered
            items={tabItems}
            onChange={(mode) => {
              setOperation(null);
              setMode(mode as 'eraser' | 'magicWand');
            }}
            size="large"
          />
        </div>
        <Footer>
          <Button key="ok" onClick={handleComplete} type="primary">
            {langGlobal.ok}
          </Button>
        </Footer>
      </Flex>
    </FullWindowPanelSider>
  );
}

const MemorizedSider = memo(Sider);

export default MemorizedSider;
