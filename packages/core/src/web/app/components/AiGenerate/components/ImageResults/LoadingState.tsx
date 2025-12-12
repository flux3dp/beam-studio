import { useMemo } from 'react';

import { Spin } from 'antd';
import dayjs from 'dayjs';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import useI18n from '@core/helpers/useI18n';

import { useTipIndex } from '../../hooks/useTipIndex';
import { useAiGenerateStore } from '../../useAiGenerateStore';

import style from './index.module.scss';

export const LoadingState = () => {
  const lang = useI18n();
  const { historyItems } = useAiGenerateStore(useShallow(pick(['historyItems'])));

  const startTime = useMemo(
    () => (historyItems.length > 0 ? dayjs(historyItems[0].created_at).valueOf() : Date.now()),
    [historyItems],
  );

  const tipIndex = useTipIndex(startTime);

  return (
    <Spin className={style['loading-spin']} size="large" tip={lang.beambox.ai_generate.loading[`tip_${tipIndex}`]}>
      <div className={style['loading-container']} />
    </Spin>
  );
};
