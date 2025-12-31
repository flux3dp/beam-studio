import React from 'react';

import { Button } from 'antd';

import FluxIcons from '@core/app/icons/flux/FluxIcons';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { IUser } from '@core/interfaces/IUser';

import { AI_COST_PER_IMAGE } from '../constants';

import styles from './StickyFooter.module.scss';

interface Props {
  buyLink: string;
  className?: string;
  isDisabled: boolean;
  maxImages: number;
  onGenerate: () => void;
  user: IUser | null;
}

const StickyFooter = ({ buyLink, className, isDisabled, maxImages, onGenerate, user }: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  return (
    <div className={className || styles['button-section']}>
      <Button
        block
        className={styles['generate-button']}
        disabled={isDisabled}
        onClick={onGenerate}
        size="large"
        type="primary"
      >
        {t.form.generate}
      </Button>
      <div className={styles['credits-info']}>
        <span className={styles['credits-required']}>
          {t.form.credit_required} {(AI_COST_PER_IMAGE * maxImages).toFixed(2)}
        </span>
        <div className={styles['credits-balance']} onClick={() => browser.open(buyLink)}>
          <FluxIcons.FluxCredit />
          <span className={styles['ai-credit']}>{user?.info?.credit || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default StickyFooter;
