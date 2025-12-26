import React, { useContext, useMemo } from 'react';

import { Button, Modal, Space } from 'antd';

import layoutConstants from '@core/app/constants/layout-constants';
import { MyCloudContext, MyCloudProvider } from '@core/app/contexts/MyCloudContext';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import isFluxPlusActive from '@core/helpers/is-flux-plus-active';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import GridFile from './GridFile';
import Head from './Head';
import styles from './MyCloud.module.scss';

interface Props {
  onClose: () => void;
}

const MyCloudModal = (): React.JSX.Element => {
  const user = getCurrentUser();
  const LANG = useI18n();
  const lang = LANG.my_cloud;
  const isMobile = useIsMobile();
  const { files, onClose, setSelectedId } = useContext(MyCloudContext);
  const anchors = [0, window.innerHeight - layoutConstants.menubarHeight];

  const content = useMemo(() => {
    if (files === undefined) {
      return <div className={styles.placeholder}>{lang.loading_file}</div>;
    }

    if (files.length === 0) {
      return (
        <div className={styles.placeholder}>
          <div>{lang.no_file_title}</div>
          <div>{lang.no_file_subtitle}</div>
        </div>
      );
    }

    return (
      <div className={styles.grids} onClick={() => setSelectedId(null)}>
        {files.map((file) => (
          <GridFile file={file} key={file.uuid} />
        ))}
      </div>
    );
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [files]);

  const title = (
    <Space
      align="center"
      className={styles['title-container']}
      direction={isMobile ? 'vertical' : 'horizontal'}
      size="middle"
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
            <Button onClick={() => browser.open(LANG.flux_id_login.flux_plus.website_url)} size="small" type="link">
              {lang.upgrade}
            </Button>
          )}
        </div>
      )}
    </Space>
  );

  return isMobile ? (
    <FloatingPanel anchors={anchors} className={styles.panel} fixedContent={<Head />} onClose={onClose} title={title}>
      {content}
    </FloatingPanel>
  ) : (
    <Modal centered footer={null} onCancel={onClose} open title={title} width={720}>
      <Head />
      {content}
    </Modal>
  );
};

const MyCloud = ({ onClose }: Props): React.JSX.Element => (
  <MyCloudProvider onClose={onClose}>
    <MyCloudModal />
  </MyCloudProvider>
);

export default MyCloud;
