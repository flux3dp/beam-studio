import React from 'react';

import { Button, Modal } from 'antd';
import { sprintf } from 'sprintf-js';

import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.update;

interface Props {
  currentVersion: string;
  deviceModel: string;
  deviceName: string;
  latestVersion: string;
  onClose: () => void;
  onDownload: () => void;
  onInstall: () => void;
  releaseNote: string;
}

const FirmwareUpdate = ({
  currentVersion = '',
  deviceModel = '',
  deviceName = '',
  latestVersion = '',
  onClose = () => {},
  onDownload = () => {},
  onInstall = () => {},
  releaseNote = '',
}: Props): React.JSX.Element => {
  const handleUpload = () => {
    onInstall();
    onClose();
  };
  const handleDownload = () => {
    onDownload();
    onClose();
  };

  return (
    <Modal
      centered
      footer={[
        <Button key="later" onClick={onClose}>
          {LANG.later}
        </Button>,
        <Button key="upload" onClick={handleUpload}>
          {LANG.upload}
        </Button>,
        <Button key="download" onClick={handleDownload} type="primary">
          {LANG.download}
        </Button>,
      ]}
      onCancel={onClose}
      open
      title={LANG.firmware.caption}
    >
      <div className="update-wrapper">
        <article className="update-brief">
          <p>{sprintf(LANG.firmware.message_pattern_1, deviceName)}</p>
          <p>{sprintf(LANG.firmware.message_pattern_2, deviceModel, latestVersion, currentVersion)}</p>
        </article>
        <h4 className="release-note-caption">{LANG.release_note}</h4>
        <div
          className="release-note-content"
          dangerouslySetInnerHTML={{
            __html: releaseNote,
          }}
        />
      </div>
    </Modal>
  );
};

export default FirmwareUpdate;
