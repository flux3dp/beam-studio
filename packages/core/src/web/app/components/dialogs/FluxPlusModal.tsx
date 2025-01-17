import classNames from 'classnames';
import React from 'react';
import { Button, Modal } from 'antd';

import browser from 'implementations/browser';
import FluxIcons from 'app/icons/flux/FluxIcons';
import isFluxPlusActive from 'helpers/is-flux-plus-active';
import useI18n from 'helpers/useI18n';
import { useIsMobile } from 'helpers/system-helper';

import styles from './FluxPlusModal.module.scss';

interface Props {
  className?: string;
  onClose: () => void;
  hideMobileBanner?: boolean;
  children: JSX.Element;
}

const FluxPlusModal = ({
  className,
  onClose,
  hideMobileBanner = false,
  children,
}: Props): JSX.Element => {
  const lang = useI18n().flux_id_login.flux_plus;
  const isMobile = useIsMobile();
  const shouldShowBanner = isFluxPlusActive && (!hideMobileBanner || !isMobile);
  return (
    <Modal
      className={classNames(styles['flux-plus'], className)}
      onCancel={onClose}
      // eslint-disable-next-line no-nested-ternary
      width={isMobile ? 320 : isFluxPlusActive ? 726 : 400}
      footer={null}
      centered
      open
    >
      <div className={styles.body}>
        {shouldShowBanner && (
          <div className={styles.banner}>
            {!isMobile && (
              <>
                <FluxIcons.FluxPlusLogo className={styles.icon} />
                <div className={styles.features}>
                  {['ai_bg_removal', 'my_cloud', 'boxgen', 'dmkt', 'monotype'].map((key) => (
                    <div key={key} className={styles.feature}>
                      <FluxIcons.FluxPlus /> {lang.features[key]}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className={styles['img-container']}>
              <img
                src={`core-img/flux-plus/explore-flux-plus${isMobile ? '-mobile' : ''}.jpg`}
                alt={lang.learn_more}
              />
            </div>
            <Button
              className={styles.button}
              block
              type="default"
              ghost
              shape="round"
              onClick={() => browser.open(lang.website_url)}
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
