import React, { memo, useCallback, useMemo, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Popover } from 'antd';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import Content from '@core/app/components/beambox/RightPanel/common/Content';
import FloatingButton from '@core/app/components/beambox/SvgEditor/FloatingButton';
import ListButtonGroup from '@core/app/components/common/ListButtonGroup';
// import Popover from '@core/app/components/dialogs/popover/Popover';
import Header from '@core/app/components/dialogs/popover/Header';
import GeneratorIcons from '@core/app/icons/generator/GeneratorIcons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { createNewFitText } from '@core/app/svgedit/text/fitText';
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
          children: lang.beambox.svg_editor.import_image.title,
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
        hint: lang.beambox.svg_editor.import_image.gallery_desc,
        icon: <LeftPanelIcons.OpenFileGallery />,
        id: 'Gallery',
        label: lang.beambox.svg_editor.import_image.gallery,
        onClick: () => onOpen('gallery'),
      },
      {
        hint: lang.beambox.svg_editor.import_image.camera_desc,
        icon: <LeftPanelIcons.OpenFileCamera />,
        id: 'Camera',
        label: lang.beambox.svg_editor.import_image.camera,
        onClick: () => onOpen('camera'),
      },
      {
        hint: lang.beambox.svg_editor.import_image.file_desc,
        icon: <LeftPanelIcons.OpenFileFiles />,
        id: 'File',
        label: lang.beambox.svg_editor.import_image.file,
        onClick: () => onOpen('file'),
      },
    ],
    [onOpen, lang],
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
          title={lang.beambox.svg_editor.import_image.title}
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
  const title = useI18n().beambox.svg_editor.drawing_tools;
  const [open, setOpen] = useState(false);

  const onClose = useCallback(() => setOpen(false), []);

  return (
    <Popover
      arrow={false}
      content={
        <>
          <Header onClose={() => setOpen(false)} title={title} />
          <AddElementButtonPopoverContent onClose={onClose} />
        </>
      }
      onOpenChange={setOpen}
      open={open}
      placement="topLeft"
      trigger="click"
      zIndex={5}
    >
      <FloatingButton icon={<PlusOutlined />} primary />
    </Popover>
  );
};

export default AddElementButton;
