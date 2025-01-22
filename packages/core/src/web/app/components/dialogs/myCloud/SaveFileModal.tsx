import React, { useMemo, useState } from 'react';

import { Button, Input, Modal, Space, Typography } from 'antd';

import currentFileManager from '@core/app/svgedit/currentFileManager';
import useI18n from '@core/helpers/useI18n';

interface Props {
  onClose: (fileName: null | string, isCancelled?: boolean) => void;
  uuid?: string;
}

const SaveFileModal = ({ onClose, uuid }: Props): React.JSX.Element => {
  const LANG = useI18n();
  const lang = LANG.my_cloud.save_file;
  const [isEditingName, setIsEditingName] = useState(!uuid);
  const [fileName, setFileName] = useState<string>(
    (currentFileManager.getName() || LANG.topbar.untitled).split('/').pop(),
  );
  const slashError = useMemo(() => fileName.includes('/'), [fileName]);
  const error = slashError || !fileName;

  return isEditingName ? (
    <Modal
      centered
      okButtonProps={{ disabled: error }}
      onCancel={() => onClose(null, true)}
      onOk={() => onClose(fileName)}
      open
      title={LANG.topbar.menu.save_to_cloud}
      width={350}
    >
      <Input
        maxLength={255}
        onChange={(e) => setFileName(e.target.value)}
        size="small"
        status={error ? 'error' : undefined}
        value={fileName}
      />
      {slashError && (
        <div>
          {lang.invalid_char} <Typography.Text keyboard>/</Typography.Text>
        </div>
      )}
    </Modal>
  ) : (
    <Modal
      centered
      footer={
        <Space>
          <Button onClick={() => setIsEditingName(true)} type="primary">
            {lang.save_new}
          </Button>
          <Button onClick={() => onClose(null)} type="primary">
            {lang.save}
          </Button>
        </Space>
      }
      onCancel={() => onClose(null, true)}
      open
      title={lang.choose_action}
      width={350}
    />
  );
};

export default SaveFileModal;
