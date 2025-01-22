import React, { useState } from 'react';

import { ExportOutlined } from '@ant-design/icons';
import { Button, Checkbox, Modal } from 'antd';

import AnnouncementHelper from '@core/helpers/announcement-helper';
import useI18n from '@core/helpers/useI18n';
import type { IAnnouncement } from '@core/interfaces/IAnnouncement';

import browser from '@app/implementations/browser';

import styles from './AnnouncementPanel.module.scss';

interface Props {
  announcement: IAnnouncement;
  onClose: () => void;
}

const AnnouncementPanel = ({ announcement, onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const handleClose = () => {
    if (isCheckboxChecked) {
      AnnouncementHelper.setNotShowing(announcement.id);
    }

    onClose();
  };

  return (
    <Modal
      centered
      className={styles.announcement}
      footer={
        announcement.link ? (
          <Button onClick={() => browser.open(announcement.link)} type="primary">
            {announcement.link_text || lang.alert.learn_more} <ExportOutlined />
          </Button>
        ) : (
          <Button onClick={handleClose} type="primary">
            {lang.alert.close}
          </Button>
        )
      }
      onCancel={handleClose}
      onOk={handleClose}
      open
      title={announcement.title || lang.beambox.announcement_panel.title}
    >
      <div className="main-content">
        {}
        <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
        <div className={styles.checkbox}>
          <Checkbox checked={isCheckboxChecked} onChange={() => setIsCheckboxChecked(!isCheckboxChecked)}>
            {lang.beambox.announcement_panel.dont_show_again}
          </Checkbox>
        </div>
      </div>
    </Modal>
  );
};

export default AnnouncementPanel;
