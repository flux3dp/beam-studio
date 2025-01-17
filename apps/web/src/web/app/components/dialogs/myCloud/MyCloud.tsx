import React, { useContext, useMemo } from 'react';
import { Button, Modal, Space } from 'antd';

import browser from 'implementations/browser';
import FloatingPanel from 'app/widgets/FloatingPanel';
import FluxIcons from 'app/icons/flux/FluxIcons';
import isFluxPlusActive from 'helpers/is-flux-plus-active';
import layoutConstants from 'app/constants/layout-constants';
import useI18n from 'helpers/useI18n';
import { getCurrentUser } from 'helpers/api/flux-id';
import { MyCloudContext, MyCloudProvider } from 'app/contexts/MyCloudContext';
import { useIsMobile } from 'helpers/system-helper';

import GridFile from './GridFile';
import Head from './Head';
import styles from './MyCloud.module.scss';

interface Props {
  onClose: () => void;
}

const MyCloudModal = (): JSX.Element => {
  const user = getCurrentUser();
  const LANG = useI18n();
  const lang = LANG.my_cloud;
  const isMobile = useIsMobile();
  const { onClose, files, setSelectedId } = useContext(MyCloudContext);
  const anchors = [0, window.innerHeight - layoutConstants.menuberHeight];

  const content = useMemo(() => {
    if (files === undefined) return <div className={styles.placeholder}>{lang.loading_file}</div>;
    if (files.length === 0)
      return (
        <div className={styles.placeholder}>
          <div>{lang.no_file_title}</div>
          <div>{lang.no_file_subtitle}</div>
        </div>
      );
    return (
      <div className={styles.grids} onClick={() => setSelectedId(null)}>
        {files.map((file) => (
          <GridFile key={file.uuid} file={file} />
        ))}
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const title = (
    <Space
      className={styles['title-container']}
      size="middle"
      align="center"
      direction={isMobile ? 'vertical' : 'horizontal'}
    >
      <div className={styles.title}>
        {user.info?.subscription?.is_valid && <FluxIcons.FluxPlus />}
        {lang.title}
      </div>
      {!user.info?.subscription?.is_valid && (
        <div className={styles.limit}>
          <div className={styles.tag}>
            {lang.file_limit} {files ? files.length : '?'}/5
          </div>
          {isFluxPlusActive && (
            <Button
              type="link"
              size="small"
              onClick={() => browser.open(LANG.flux_id_login.flux_plus.website_url)}
            >
              {lang.upgrade}
            </Button>
          )}
        </div>
      )}
    </Space>
  );

  return isMobile ? (
    <FloatingPanel
      className={styles.panel}
      anchors={anchors}
      title={title}
      fixedContent={<Head />}
      onClose={onClose}
    >
      {content}
    </FloatingPanel>
  ) : (
    <Modal title={title} footer={null} width={720} onCancel={onClose} centered open>
      <Head />
      {content}
    </Modal>
  );
};

const MyCloud = ({ onClose }: Props): JSX.Element => (
  <MyCloudProvider onClose={onClose}>
    <MyCloudModal />
  </MyCloudProvider>
);

export default MyCloud;
