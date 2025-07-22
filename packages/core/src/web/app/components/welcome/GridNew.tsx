import React from 'react';

import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import funcs from '@core/app/actions/beambox/svgeditor-function-wrapper';
import useI18n from '@core/helpers/useI18n';

import styles from './GridFile.module.scss';

const GridNew = () => {
  const { welcome_page: t } = useI18n();

  return (
    <div className={styles['text-container']}>
      <div className={classNames(styles['text-content'], styles.button)} onClick={funcs.clearScene}>
        <PlusOutlined className={styles.icon} />
        <div className={styles.text}>{t.new_project}</div>
      </div>
    </div>
  );
};

export default GridNew;
