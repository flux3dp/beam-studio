import { Spin } from 'antd';

import style from './index.module.scss';

export const LoadingState = () => (
  <div className={style['loading-container']}>
    <Spin className={style['loading-spinner']} size="large" />
    <p className={style['loading-text']}>Generating your images...</p>
  </div>
);
