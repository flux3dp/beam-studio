import React, { useMemo, useState } from 'react';
import { Button, Input, Modal, Space, Typography } from 'antd';

import currentFileManager from 'app/svgedit/currentFileManager';
import useI18n from 'helpers/useI18n';

interface Props {
  onClose: (fileName: string | null, isCancelled?: boolean) => void;
  uuid?: string;
}

const SaveFileModal = ({ onClose, uuid }: Props): JSX.Element => {
  const LANG = useI18n();
  const lang = LANG.my_cloud.save_file;
  const [isEditingName, setIsEditingName] = useState(!uuid);
  const [fileName, setFileName] = useState<string>(
    (currentFileManager.getName() || LANG.topbar.untitled).split('/').pop()
  );
  const slashError = useMemo(() => fileName.includes('/'), [fileName]);
  const error = slashError || !fileName;

  return isEditingName ? (
    <Modal
      title={LANG.topbar.menu.save_to_cloud}
      onOk={() => onClose(fileName)}
      onCancel={() => onClose(null, true)}
      okButtonProps={{ disabled: error }}
      width={350}
      centered
      open
    >
      <Input
        size="small"
        value={fileName}
        status={error ? 'error' : undefined}
        onChange={(e) => setFileName(e.target.value)}
        maxLength={255}
      />
      {slashError && (
        <div>
          {lang.invalid_char} <Typography.Text keyboard>/</Typography.Text>
        </div>
      )}
    </Modal>
  ) : (
    <Modal
      title={lang.choose_action}
      onCancel={() => onClose(null, true)}
      footer={
        <Space>
          <Button type="primary" onClick={() => setIsEditingName(true)}>
            {lang.save_new}
          </Button>
          <Button type="primary" onClick={() => onClose(null)}>
            {lang.save}
          </Button>
        </Space>
      }
      width={350}
      centered
      open
    />
  );
};

export default SaveFileModal;
