import React, { memo } from 'react';

import type { TabPaneProps } from 'antd';
import { Button, Flex, Tabs } from 'antd';

import ImageEditPanelIcons from '@core/app/icons/image-edit-panel/ImageEditPanelIcons';
import BackButton from '@core/app/widgets/FullWindowPanel/BackButton';
import Footer from '@core/app/widgets/FullWindowPanel/Footer';
import Header from '@core/app/widgets/FullWindowPanel/Header';
import FullWindowPanelSider from '@core/app/widgets/FullWindowPanel/Sider';
import useI18n from '@core/helpers/useI18n';

import Eraser from './Eraser';
import styles from './index.module.scss';
import MagicWand from './MagicWand';

interface Props {
  brushSize: number;
  handleComplete: () => void;
  mode: 'eraser' | 'magicWand';
  onClose: () => void;
  setBrushSize: (size: number) => void;
  setMode: (mode: 'eraser' | 'magicWand') => void;
  setOperation: (operation: 'drag' | 'eraser' | 'magicWand' | null) => void;
  setTolerance: (tolerance: number) => void;
  tolerance: number;
}

interface Tab extends Omit<TabPaneProps, 'tab'> {
  key: string;
  label: React.ReactNode;
}

function Sider({
  brushSize,
  handleComplete,
  mode,
  onClose,
  setBrushSize,
  setMode,
  setOperation,
  setTolerance,
  tolerance,
}: Props): React.JSX.Element {
  const {
    beambox: { photo_edit_panel: langPhoto },
    buttons: langButtons,
    image_edit_panel: lang,
  } = useI18n();

  const tabItems: Tab[] = [
    {
      children: <Eraser brushSize={brushSize} setBrushSize={setBrushSize} />,
      icon: <ImageEditPanelIcons.Eraser />,
      key: 'eraser',
      label: lang.eraser.title,
    },
    {
      children: <MagicWand setTolerance={setTolerance} tolerance={tolerance} />,
      icon: <ImageEditPanelIcons.MagicWand />,
      key: 'magicWand',
      label: lang.magic_wand.title,
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
