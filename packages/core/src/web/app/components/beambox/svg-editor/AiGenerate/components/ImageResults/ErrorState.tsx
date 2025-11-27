import { Alert, Button } from 'antd';

import useI18n from '@core/helpers/useI18n'; //
import browser from '@core/implementations/browser';

import styles from './index.module.scss';

export const ErrorState = ({ error }: { error: null | string }) => {
  const lang = useI18n();

  if (!error) return null;

  const isInsufficientCredits = error.startsWith('INSUFFICIENT_CREDITS');
  const displayMessage = error.replace('INSUFFICIENT_CREDITS:', '');

  if (isInsufficientCredits) {
    return (
      <Alert
        closable
        description={
          <div className={styles['error-div']}>
            <span>{displayMessage}</span>
            <Button
              onClick={() => browser.open(lang.flux_id_login.flux_plus.member_center_url)}
              size="small"
              type="primary"
            >
              {lang.flux_id_login.flux_plus.goto_member_center}
            </Button>
          </div>
        }
        message="Insufficient Credits"
        showIcon
        type="warning"
      />
    );
  }

  return <Alert closable description={displayMessage} message="Generation Failed" showIcon type="error" />;
};
