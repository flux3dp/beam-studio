import React from 'react';

import { Button, Modal } from 'antd';
import classNames from 'classnames';

import FluxIcons from '@core/app/icons/flux/FluxIcons';
import isFluxPlusActive from '@core/helpers/is-flux-plus-active';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './FluxPlusModal.module.scss';

interface Props {
  children: React.JSX.Element;
  className?: string;
  hideMobileBanner?: boolean;
  onClose: () => void;
}

const FluxPlusModal = ({ children, className, hideMobileBanner = false, onClose }: Props): React.JSX.Element => {
  const lang = useI18n().flux_id_login.flux_plus;
  const isMobile = useIsMobile();
  const shouldShowBanner = isFluxPlusActive && (!hideMobileBanner || !isMobile);

  return (
    <Modal
      centered
      className={classNames(styles['flux-plus'], className)}
      footer={null}
      onCancel={onClose}
      open
      width={isMobile ? 320 : isFluxPlusActive ? 726 : 400}
    >
      <div className={styles.body}>
        {shouldShowBanner && (
          <div className={styles.banner}>
            {!isMobile && (
              <>
                <FluxIcons.FluxPlusLogo className={styles.icon} />
                <div className={styles.features}>
                  {['ai_bg_removal', 'my_cloud', 'boxgen', 'dmkt', 'monotype'].map((key) => (
                    <div className={styles.feature} key={key}>
                      <FluxIcons.FluxPlus /> {lang.features[key]}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className={styles['img-container']}>
              <img alt={lang.learn_more} src={`core-img/flux-plus/explore-flux-plus${isMobile ? '-mobile' : ''}.jpg`} />
            </div>
            <Button
              block
              className={styles.button}
              ghost
              onClick={() => browser.open(lang.website_url)}
              shape="round"
              type="default"
            >
              {lang.learn_more}
            </Button>
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </Modal>
  );
};

export default FluxPlusModal;
