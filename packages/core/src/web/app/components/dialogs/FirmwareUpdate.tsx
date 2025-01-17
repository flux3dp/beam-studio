import React from 'react';
import { Button, Modal } from 'antd';
import { sprintf } from 'sprintf-js';

import i18n from 'helpers/i18n';

const LANG = i18n.lang.update;
interface Props {
  deviceName: string;
  deviceModel: string;
  currentVersion: string;
  latestVersion: string;
  releaseNote: string;
  onDownload: () => void;
  onClose: () => void;
  onInstall: () => void;
}

const FirmwareUpdate = ({
  deviceName = '',
  deviceModel = '',
  currentVersion = '',
  latestVersion = '',
  releaseNote = '',
  onDownload = () => {},
  onClose = () => {},
  onInstall = () => {},
}: Props): JSX.Element => {
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
      open
      centered
      title={LANG.firmware.caption}
      onCancel={onClose}
      footer={[
        <Button key="later" onClick={onClose}>{LANG.later}</Button>,
        <Button key="upload" onClick={handleUpload}>{LANG.upload}</Button>,
        <Button key="download" type="primary" onClick={handleDownload}>
          {LANG.download}
        </Button>,
      ]}
    >
      <div className="update-wrapper">
        <article className="update-brief">
          <p>{sprintf(LANG.firmware.message_pattern_1, deviceName)}</p>
          <p>
            {sprintf(LANG.firmware.message_pattern_2, deviceModel, latestVersion, currentVersion)}
          </p>
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
