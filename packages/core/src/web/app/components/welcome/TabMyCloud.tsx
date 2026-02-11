import React, { use, useMemo } from 'react';

import { CloudOutlined } from '@ant-design/icons';

import GridFile from '@core/app/components/dialogs/myCloud/GridFile';
import GridPlaceholder from '@core/app/components/welcome/GridPlaceholder';
import { MyCloudContext, MyCloudProvider } from '@core/app/contexts/MyCloudContext';
import useI18n from '@core/helpers/useI18n';
import type { IUser } from '@core/interfaces/IUser';

import styles from './TabMyCloud.module.scss';

interface Props {
  user: IUser | null;
}

const MyCloudContent = ({ user }: Props) => {
  const { files, setSelectedId } = use(MyCloudContext);
  const { my_cloud: t } = useI18n();

  const content = useMemo(() => {
    if (!user) {
      return (
        <div className={styles.grids}>
          <GridPlaceholder placeholder={t.not_login_title} />
        </div>
      );
    }

    if (files === undefined) {
      return <div className={styles.placeholder}>{t.loading_file}</div>;
    }

    if (files.length === 0) {
      return (
        <div className={styles.grids}>
          <GridPlaceholder hint={t.no_file_subtitle} placeholder={t.no_file_title} />
        </div>
      );
    }

    return (
      <div className={styles.grids}>
        {files.map((file) => (
          <GridFile file={file} key={file.uuid} />
        ))}
      </div>
    );
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [files, user]);

  return (
    <div>
      <div className={styles.title}>
        <CloudOutlined /> {t.title}
        {user && !user.info?.subscription?.is_valid && (
          <div className={styles.limit}>
            <div className={styles.tag}>
              {t.file_limit} {files ? files.length : '?'}/5
            </div>
          </div>
        )}
      </div>
      <div className={styles.content} onClick={() => setSelectedId(null)}>
        {content}
      </div>
    </div>
  );
};

const TabMyCloud = ({ user }: Props) =>
  user ? (
    <MyCloudProvider fromWelcomePage onClose={() => {}}>
      <MyCloudContent user={user} />
    </MyCloudProvider>
  ) : (
    <MyCloudContent user={user} />
  );

export default TabMyCloud;
