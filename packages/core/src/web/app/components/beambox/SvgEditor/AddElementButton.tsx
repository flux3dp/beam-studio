import React, { memo, useCallback, useMemo, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import Content from '@core/app/components/beambox/RightPanel/common/Content';
import FloatingButton from '@core/app/components/beambox/SvgEditor/FloatingButton';
import ListButtonGroup from '@core/app/components/common/ListButtonGroup';
import Popover from '@core/app/components/dialogs/popover/Popover';
import GeneratorIcons from '@core/app/icons/generator/GeneratorIcons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { createNewFitText } from '@core/app/svgedit/text/fitText';
import { mockT } from '@core/helpers/is-dev';
import isWebFn from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';

import styles from './AddElementButton.module.scss';

const AddElementButtonPopoverContent = memo(({ onClose }: { onClose: () => void }): React.JSX.Element => {
  const isWeb = isWebFn();
  const lang = useI18n();
  const [showImportImage, setShowImportImage] = useState(false);

  const onOpen = useCallback((method?: 'camera' | 'file' | 'gallery') => {
    FnWrapper.importImage(method);
    setShowImportImage(false);
  }, []);

  const items = useMemo(
    () =>
      [
        {
          children: mockT('上傳圖片'),
          icon: <LeftPanelIcons.Photo />,
          onClick: () => (isWeb ? setShowImportImage(true) : FnWrapper.importImage()),
        },
        {
          children: lang.beambox.left_panel.label.fit_text,
          icon: <LeftPanelIcons.TextBox />,
          onClick: () => createNewFitText(100, 100, { addToHistory: true, isToSelect: true, text: 'Text' }),
        },
        {
          children: lang.beambox.left_panel.label.elements,
          icon: <LeftPanelIcons.Element />,
          onClick: () => useCanvasStore.getState().toggleDrawerMode('element-panel'),
        },
        {
          type: 'divider' as const,
        },
        {
          children: lang.beambox.ai_generate.header.title,
          icon: <LeftPanelIcons.AiGenerate />,
          onClick: () => useCanvasStore.getState().toggleDrawerMode('ai-generate'),
        },
        {
          children: lang.generators.title,
          icon: <GeneratorIcons.Generator />,
          onClick: () => useCanvasStore.getState().toggleDrawerMode('generator'),
        },
      ].map((item) => ({
        ...item,
        onClick: () => {
          item.onClick?.();
          onClose();
        },
      })),
    [isWeb, lang, onClose],
  );

  const openFileItems = useMemo(
    () => [
      {
        hint: mockT('從裝置選擇圖片檔案'),
        icon: <LeftPanelIcons.OpenFileGallery />,
        id: 'Gallery',
        label: mockT('照片圖庫'),
        onClick: () => onOpen('gallery'),
      },
      {
        hint: mockT('使用相機拍攝新照片'),
        icon: <LeftPanelIcons.OpenFileCamera />,
        id: 'Camera',
        label: mockT('拍攝照片'),
        onClick: () => onOpen('camera'),
      },
      {
        hint: mockT('從裝置選擇圖片檔案'),
        icon: <LeftPanelIcons.OpenFileFiles />,
        id: 'File',
        label: mockT('選擇檔案'),
        onClick: () => onOpen('file'),
      },
    ],
    [onOpen],
  );

  return (
    <>
      <ListButtonGroup items={items} />
      {isWeb && (
        <Modal
          centered
          footer={null}
          onCancel={() => setShowImportImage(false)}
          onClose={() => setShowImportImage(false)}
          open={showImportImage}
          title={mockT('上傳圖片')}
        >
          <Content>
            {openFileItems.map((item) => (
              <Button className={styles.button} icon={item.icon} key={item.id} onClick={item.onClick}>
                <div className={styles.texts}>
                  <div>{item.label}</div>
                  <span className={styles.hint}>{item.hint}</span>
                </div>
              </Button>
            ))}
          </Content>
        </Modal>
      )}
    </>
  );
});

const AddElementButton = () => {
  const [open, setOpen] = useState(false);

  const onClose = useCallback(() => setOpen(false), []);

  return (
    <Popover
      onOpenChange={setOpen}
      open={open}
      placement="topLeft"
      title={mockT('設計工具')}
      triggerComponent={<FloatingButton icon={<PlusOutlined />} primary />}
    >
      <AddElementButtonPopoverContent onClose={onClose} />
    </Popover>
  );
};

export default AddElementButton;
