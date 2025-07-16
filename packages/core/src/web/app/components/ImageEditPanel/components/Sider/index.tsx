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

function Sider({
  handleComplete,
  mode,
  onClose,
  setMode,
  setOperation,
}: Props): React.JSX.Element {
  const {
    beambox: { photo_edit_panel: langPhoto },
    buttons: langButtons,
    image_edit_panel: lang,
  } = useI18n();

  const tabItems: Tab[] = [
    {
      children: <Eraser />,
      icon: <ImageEditPanelIcons.Eraser />,
      key: 'eraser',
      label: lang.eraser.title,
    },
    {
      children: <MagicWand  />,
      icon: <ImageEditPanelIcons.MagicWand />,
      key: 'magicWand',
      label: lang.magic_wand.title,
    },
    {
      children: <CornerRadius />,
      icon: <ImageEditPanelIcons.CornerRadius />,
      key: 'cornerRadius',
      label: lang.rounded_corner.title,
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
            {langPhoto.okay}
          </Button>
        </Footer>
      </Flex>
    </FullWindowPanelSider>
  );
}

const MemorizedSider = memo(Sider);

export default MemorizedSider;
