import { useContext, useMemo } from 'react';

import { CloudOutlined } from '@ant-design/icons';

import GridFile from '@core/app/components/welcome/GridFile';
import GridPlaceholder from '@core/app/components/welcome/GridPlaceholder';
import { MyCloudContext, MyCloudProvider } from '@core/app/contexts/MyCloudContext';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import useI18n from '@core/helpers/useI18n';

import styles from './TabMyCloud.module.scss';

const MyCloudContent = () => {
  const user = getCurrentUser();
  const { files, setSelectedId } = useContext(MyCloudContext);
  const { my_cloud: t } = useI18n();

  const content = useMemo(() => {
    if (files === undefined) {
      return <div className={styles.placeholder}>{t.loading_file}</div>;
    }

    if (files.length === 0) {
      return <GridPlaceholder hint={t.no_file_subtitle} placeholder={t.no_file_title} />;
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

  return (
    <div>
      <div className={styles.title}>
        <CloudOutlined /> {t.title}
        {!user?.info?.subscription?.is_valid && (
          <div className={styles.limit}>
            <div className={styles.tag}>
              {t.file_limit} {files ? files.length : '?'}/5
            </div>
          </div>
        )}
      </div>
      <div className={styles.content}>{content}</div>
    </div>
  );
};

const TabMyCloud = () => (
  <MyCloudProvider onClose={() => {}}>
    <MyCloudContent />
  </MyCloudProvider>
);

export default TabMyCloud;
