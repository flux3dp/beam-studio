// Course certificate (PRD R11, D19): a screen only — image export waits for the final design.
// Layout follows the draft attached to the ClickUp task; the badges and date are derived.
import React, { useEffect } from 'react';

import { Button, Modal } from 'antd';
import { sprintf } from 'sprintf-js';

import { getCurrentUser } from '@core/helpers/api/flux-id';
import { rainConfetti } from '@core/helpers/confetti';
import useI18n from '@core/helpers/useI18n';

import { CHAPTERS } from './catalog';
import styles from './Flux101Certificate.module.scss';
import { useFlux101Bucket } from './progress';

interface Flux101CertificateProps {
  /** true when opened by the 23/23 completion itself: confetti rain */
  celebrate?: boolean;
  onClose: () => void;
}

const Flux101Certificate = ({ celebrate, onClose }: Flux101CertificateProps): React.JSX.Element => {
  const t = useI18n().flux_101;
  const bucket = useFlux101Bucket();
  const user = getCurrentUser();
  const name: string = user?.info?.nickname ?? user?.email ?? '—';
  const completedAt = Math.max(...Object.values(bucket.lessons).map((l) => Date.parse(l.completedAt ?? '') || 0));
  const date = completedAt ? new Date(completedAt).toLocaleDateString() : '—';

  useEffect(() => {
    if (celebrate) rainConfetti();
  }, [celebrate]);

  return (
    <Modal
      centered
      closable={false}
      footer={null}
      onCancel={onClose}
      open
      styles={{ body: { padding: 0 }, content: { background: 'transparent', boxShadow: 'none', padding: 0 } }}
      width={800}
    >
      <div className={styles.cert}>
        <div className={styles.frame} />
        <div className={styles.top}>
          <span className={styles.brand}>
            <b>FLUX</b> · BEAM STUDIO
          </span>
        </div>
        <div className={styles.kicker}>{t.certificate_title}</div>
        <div className={styles.title}>FLUX 101</div>
        <div className={styles.sub}>{t.certificate_subtitle}</div>
        <div className={styles.cap}>{t.certificate_this_certifies}</div>
        <div className={styles.name}>{name}</div>
        <div className={styles.desc}>{t.certificate_desc}</div>
        <div className={styles.badges}>
          {CHAPTERS.map((ch) => (
            <div className={styles.badge} key={ch.id}>
              <span className={styles.emoji}>{ch.badgeEmoji}</span>
              {t.badges[ch.id]}
            </div>
          ))}
        </div>
        <div className={styles.foot}>
          <span className={styles.seal}>🎓</span>
          <span>{sprintf(t.certificate_completed_on, { date })}</span>
        </div>
      </div>
      <div className={styles.actions}>
        <Button onClick={onClose}>{t.close}</Button>
      </div>
    </Modal>
  );
};

export default Flux101Certificate;
