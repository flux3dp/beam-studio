import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';

import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { getCurrentUser, signOut } from '@core/helpers/api/flux-id';
import isFluxPlusActive from '@core/helpers/is-flux-plus-active';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './FluxCredit.module.scss';
import FluxPlusModal from './FluxPlusModal';

interface Props {
  onClose: () => void;
}

const FluxCredit = ({ onClose }: Props): React.JSX.Element => {
  const LANG = useI18n();
  const lang = LANG.flux_id_login;
  const isMobile = useIsMobile();
  const { email, info } = getCurrentUser()!;

  return (
    <FluxPlusModal onClose={onClose}>
      <div className={styles.content}>
        {!isMobile && <img alt={lang.login_success} src="core-img/flux-plus/man-high-five.jpg" />}
        <div className={styles.head}>
          <div className={styles.title}>{lang.login_success}</div>
          <div className={styles.subtitle}>{lang.flux_plus.thank_you}</div>
        </div>
        <div className={styles.info}>
          <div>
            {lang.email}: <span className={styles.email}>{email}</span>
          </div>
          {info?.subscription?.is_valid && (
            <div
              className={styles['credit-container']}
              onClick={() => browser.open(LANG.beambox.popup.ai_credit.buy_link)}
            >
              <Tooltip title={lang.flux_plus.flux_credit_tooltip}>
                <QuestionCircleOutlined />
              </Tooltip>
              FLUX Credit:
              <FluxIcons.FluxCredit />
              <span className={styles['flux-credit']}>{info?.subscription?.credit || 0}</span>
            </div>
          )}
          <div
            className={styles['credit-container']}
            onClick={() => browser.open(LANG.beambox.popup.ai_credit.buy_link)}
          >
            <Tooltip title={lang.flux_plus.ai_credit_tooltip}>
              <QuestionCircleOutlined />
            </Tooltip>
            AI Credit:
            <FluxIcons.FluxCredit />
            <span className={styles['ai-credit']}>{info?.credit || 0}</span>
          </div>
        </div>
        <Space className={styles.footer} direction="vertical">
          {isFluxPlusActive && (
            <Button block onClick={() => browser.open(lang.flux_plus.member_center_url)} type="primary">
              {lang.flux_plus.goto_member_center}
            </Button>
          )}
          <Button
            block
            onClick={async () => {
              await signOut();
              onClose();
            }}
            type="default"
          >
            {LANG.topbar.menu.logout}
          </Button>
        </Space>
      </div>
    </FluxPlusModal>
  );
};

export default FluxCredit;
