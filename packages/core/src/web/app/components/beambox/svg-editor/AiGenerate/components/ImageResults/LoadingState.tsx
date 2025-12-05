import { Spin } from 'antd';

import style from './index.module.scss';

export const LoadingState = () => (
  <Spin size="large" tip="Generating your images...">
    <div className={style['loading-container']} />
  </Spin>
);
