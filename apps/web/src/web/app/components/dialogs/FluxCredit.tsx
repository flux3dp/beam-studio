import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import browser from 'implementations/browser';
import FluxIcons from 'app/icons/flux/FluxIcons';
import isFluxPlusActive from 'helpers/is-flux-plus-active';
import useI18n from 'helpers/useI18n';
import { getCurrentUser, signOut } from 'helpers/api/flux-id';
import { useIsMobile } from 'helpers/system-helper';

import FluxPlusModal from './FluxPlusModal';
import styles from './FluxCredit.module.scss';

interface Props {
  onClose: () => void;
}

const FluxCredit = ({ onClose }: Props): JSX.Element => {
  const LANG = useI18n();
  const lang = LANG.flux_id_login;
  const isMobile = useIsMobile();
  const { email, info } = getCurrentUser();

  return (
    <FluxPlusModal onClose={onClose}>
      <div className={styles.content}>
        {!isMobile && <img src="core-img/flux-plus/man-high-five.jpg" alt={lang.login_success} />}
        <div className={styles.head}>
          <div className={styles.title}>{lang.login_success}</div>
          <div className={styles.subtitle}>{lang.flux_plus.thank_you}</div>
        </div>
        <div className={styles.info}>
          <div>
            {lang.email}: <span className={styles.email}>{email}</span>
          </div>
          {info?.subscription?.is_valid && (
            <div>
              <Tooltip title={lang.flux_plus.flux_credit_tooltip}>
                <QuestionCircleOutlined />
              </Tooltip>
              FLUX Credit:
              <FluxIcons.FluxCredit />
              <span className={styles['flux-credit']}>{info?.subscription?.credit || 0}</span>
            </div>
          )}
          <div>
            <Tooltip title={lang.flux_plus.ai_credit_tooltip}>
              <QuestionCircleOutlined />
            </Tooltip>
            AI Credit:
            <FluxIcons.AICredit />
            <span className={styles['ai-credit']}>{info?.credit || 0}</span>
          </div>
        </div>
        <Space className={styles.footer} direction="vertical">
          {isFluxPlusActive && (
            <Button
              block
              type="primary"
              onClick={() => browser.open(lang.flux_plus.member_center_url)}
            >
              {lang.flux_plus.goto_member_center}
            </Button>
          )}
          <Button
            block
            type="default"
            onClick={async () => {
              await signOut();
              onClose();
            }}
          >
            {LANG.topbar.menu.sign_out}
          </Button>
        </Space>
      </div>
    </FluxPlusModal>
  );
};

export default FluxCredit;
