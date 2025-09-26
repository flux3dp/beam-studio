import React, { memo } from 'react';

import classNames from 'classnames';

import { isAtPage } from '@core/helpers/hashHelper';

import styles from './index.module.scss';

const UnmemorizedAiGenerate = () => {
  const inWelcomePage = isAtPage('welcome');

  return (
    <div className={classNames(styles['ai-generate-container'], { [styles['welcome-page']]: inWelcomePage })}>
      <div className={styles['ai-generate-content']}>
        AI Generate Panel - Coming Soon
      </div>
    </div>
  );
};

const AiGenerate = memo(UnmemorizedAiGenerate, () => true);

export default AiGenerate;