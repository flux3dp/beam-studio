import { useMemo } from 'react';

import Icon from '@ant-design/icons';
import { Button, Col, ConfigProvider, Modal, Row } from 'antd';

import layoutConstants from '@core/app/constants/layout-constants';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import type { ImageEditState } from './useImageEdit';

interface Props {
  compareBase64: string;
  content?: React.ReactNode;
  contentHeight?: number;
  contentWidth?: number;
  displayBase64: string;
  onClose: () => void;
  onOk: () => void;
  setState: (newState: Partial<ImageEditState>) => void;
  state: ImageEditState;
  title: string;
}

export const ImageEditComparePanel = ({
  compareBase64,
  content,
  contentHeight = 60,
  contentWidth = 60,
  displayBase64,
  onClose,
  onOk,
  setState,
  state,
  title,
}: Props) => {
  const {
    beambox: { photo_edit_panel: t },
    global: tGlobal,
  } = useI18n();
  const isMobile = useIsMobile();
  const { imageHeight, imageWidth, isShowingOriginal } = state;

  const footer = useMemo(
    () => [
      <Button
        key="preview"
        onMouseDown={() => setState({ isShowingOriginal: true })}
        onMouseLeave={() => setState({ isShowingOriginal: false })}
        onMouseUp={() => setState({ isShowingOriginal: false })}
        onTouchEnd={() => setState({ isShowingOriginal: false })}
        onTouchStart={() => setState({ isShowingOriginal: true })}
        type="dashed"
      >
        {t.compare}
      </Button>,
      <Button key="cancel" onClick={onClose}>
        {tGlobal.cancel}
      </Button>,
      <Button key="ok" onClick={onOk} type="primary">
        {tGlobal.ok}
      </Button>,
    ],
    [setState, onClose, onOk, tGlobal.cancel, tGlobal.ok, t.compare],
  );

  if (isMobile) {
    const [previewButton, ...footerButtons] = footer;

    return (
      <ConfigProvider
        theme={{
          components: {
            Button: { borderRadius: 100 },
            InputNumber: { borderRadius: 100 },
          },
        }}
      >
        <Modal
          centered
          className={styles.modal}
          closeIcon={<Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} />}
          footer={footerButtons}
          onCancel={onClose}
          open
        >
          <div className={styles.title}>{title}</div>
          <div className={styles['preview-btn']}>{previewButton}</div>
          <div className={styles.preview}>
            <img src={isShowingOriginal ? compareBase64 : displayBase64} />
          </div>
          {content}
        </Modal>
      </ConfigProvider>
    );
  }

  const maxModalWidth = window.innerWidth - 32;
  const maxModalHeight = window.innerHeight - 2 * layoutConstants.topBarHeight;
  const modalPaddingX = 48;
  const modalControlHeight = 116;
  const maxAllowableWidth = maxModalWidth - modalPaddingX;
  const maxAllowableHeight = maxModalHeight - modalControlHeight;

  let imgDisplayWidth = 0;
  let imgDisplayHeight = 0;

  if (imageWidth > 0 && imageHeight > 0) {
    const imageRatio = Math.max(
      // max allowed image ratio when control is aligned horizontally
      Math.min((maxAllowableWidth - contentWidth) / imageWidth, maxAllowableHeight / imageHeight),
      // max allowed image ratio when control is aligned vertically
      Math.min((maxAllowableHeight - contentHeight) / imageHeight, maxAllowableWidth / imageWidth),
    );

    imgDisplayWidth = imageWidth * imageRatio;
    imgDisplayHeight = imageHeight * imageRatio;
  }

  const imgSizeStyle: React.CSSProperties = {
    height: imgDisplayHeight,
    width: imgDisplayWidth,
  };

  return (
    <Modal
      centered
      footer={footer}
      onCancel={onClose}
      open
      title={title}
      width={imgDisplayWidth + contentWidth + modalPaddingX}
    >
      <Row gutter={10} justify="center">
        <Col flex={`0 0 ${imgDisplayWidth}px`}>
          <img src={isShowingOriginal ? compareBase64 : displayBase64} style={imgSizeStyle} />
        </Col>
        <Col flex={`1 1 ${contentWidth}px`}>{content}</Col>
      </Row>
    </Modal>
  );
};

export default ImageEditComparePanel;
