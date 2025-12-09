import { useEffect, useState } from 'react';

import { Spin } from 'antd';
import dayjs from 'dayjs';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import useI18n from '@core/helpers/useI18n';

import { useAiGenerateStore } from '../../useAiGenerateStore';

import style from './index.module.scss';

export const LoadingState = () => {
  const lang = useI18n();
  const { historyItems } = useAiGenerateStore(useShallow(pick(['historyItems'])));
  const [startTime] = useState(Date.now());
  const [tipIndex, setTipIndex] = useState<0 | 1 | 2 | 3 | 4>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - (historyItems.length > 0 ? dayjs(historyItems[0].created_at).valueOf() : startTime);

      // update tip index based on elapsed time
      // 0-15s: tip_0
      // 15-30s: tip_1
      // 30-60s: tip_2
      // 60-90s: tip_3
      // >90s: tip_4
      if (elapsed > 90000) {
        setTipIndex(4);
      } else if (elapsed > 60000) {
        setTipIndex(3);
      } else if (elapsed > 30000) {
        setTipIndex(2);
      } else if (elapsed > 15000) {
        setTipIndex(1);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      setTipIndex(0);
    };
  });

  return (
    <Spin size="large" tip={lang.beambox.ai_generate.loading[`tip_${tipIndex}`]}>
      <div className={style['loading-container']} />
    </Spin>
  );
};
