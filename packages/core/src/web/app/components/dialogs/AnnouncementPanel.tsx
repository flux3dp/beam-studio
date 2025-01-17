import React, { useState } from 'react';
import { Button, Checkbox, Modal } from 'antd';

import AnnouncementHelper from 'helpers/announcement-helper';
import browser from 'implementations/browser';
import useI18n from 'helpers/useI18n';
import { ExportOutlined } from '@ant-design/icons';
import { IAnnouncement } from 'interfaces/IAnnouncement';

import styles from './AnnouncementPanel.module.scss';

interface Props {
  announcement: IAnnouncement;
  onClose: () => void;
}

const AnnouncementPanel = ({ announcement, onClose }: Props): JSX.Element => {
  const lang = useI18n();
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const handleClose = () => {
    if (isCheckboxChecked) AnnouncementHelper.setNotShowing(announcement.id);
    onClose();
  };

  return (
    <Modal
      className={styles.announcement}
      title={announcement.title || lang.beambox.announcement_panel.title}
      onCancel={handleClose}
      onOk={handleClose}
      footer={
        announcement.link ? (
          <Button type="primary" onClick={() => browser.open(announcement.link)}>
            {announcement.link_text || lang.alert.learn_more} <ExportOutlined />
          </Button>
        ) : (
          <Button type="primary" onClick={handleClose}>
            {lang.alert.close}
          </Button>
        )
      }
      centered
      open
    >
      <div className="main-content">
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
        <div className={styles.checkbox}>
          <Checkbox
            checked={isCheckboxChecked}
            onChange={() => setIsCheckboxChecked(!isCheckboxChecked)}
          >
            {lang.beambox.announcement_panel.dont_show_again}
          </Checkbox>
        </div>
      </div>
    </Modal>
  );
};

export default AnnouncementPanel;
