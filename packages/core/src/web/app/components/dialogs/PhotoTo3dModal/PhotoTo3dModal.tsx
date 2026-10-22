import React, { useState } from 'react';

import { Alert, Checkbox, InputNumber } from 'antd';
import { sprintf } from 'sprintf-js';

import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import {
  convertPhotoTo3d,
  DEFAULT_SHARPEN,
  PHOTO_TO_3D_COST,
  SHARPEN_AMOUNT_LIMIT,
  SHARPEN_RADIUS_LIMIT,
} from '@core/app/svgedit/stl/photoTo3d';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './PhotoTo3dModal.module.scss';

interface Props {
  element: SVGImageElement;
  /** The photo already has a transparent background, so removing it again is off by default. */
  hasTransparency: boolean;
  onClose: () => void;
}

/** The choices sent along with a photo-to-3D conversion, and its cost. */
const PhotoTo3dModal = ({ element, hasTransparency, onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.inner_engraving_settings;
  const tCredit = lang.beambox.ai_upscale_panel;
  const [removeBackground, setRemoveBackground] = useState(!hasTransparency);
  const [sharpenAmount, setSharpenAmount] = useState<number>(DEFAULT_SHARPEN.amount);
  const [sharpenRadius, setSharpenRadius] = useState<number>(DEFAULT_SHARPEN.radius);
  const [failed, setFailed] = useState(false);
  const info = getCurrentUser()?.info;
  const balance = (info?.subscription?.credit ?? 0) + (info?.credit ?? 0);
  const insufficient = balance < PHOTO_TO_3D_COST;

  const start = async () => {
    if (await convertPhotoTo3d(element, { removeBackground, sharpenAmount, sharpenRadius })) {
      MessageCaller.openMessage({ content: t.photo_to_3d_done, level: MessageLevel.SUCCESS });
      onClose();
    } else {
      setFailed(true);
    }
  };

  return (
    <DraggableModal
      cancelText={lang.global.cancel}
      maskClosable={false}
      okButtonProps={{ disabled: insufficient }}
      okText={failed ? lang.beambox.ai_upscale_panel.retry : t.photo_to_3d}
      onCancel={onClose}
      onOk={start}
      open
      title={t.photo_to_3d}
      width={480}
    >
      <div className={styles.container}>
        <p className={styles.description}>{t.photo_to_3d_description}</p>
        {insufficient && <Alert message={t.photo_to_3d_insufficient_credit} type="warning" />}
        <Checkbox
          checked={removeBackground}
          id="photo-to-3d-remove-background"
          onChange={(e) => setRemoveBackground(e.target.checked)}
        >
          {t.photo_to_3d_remove_background}
        </Checkbox>
        <p className={styles.hint}>{t.photo_to_3d_remove_background_hint}</p>
        <div className={styles.row}>
          <label className={styles.key} htmlFor="photo-to-3d-sharpen">
            {t.photo_to_3d_sharpen}
          </label>
          <InputNumber
            id="photo-to-3d-sharpen"
            max={SHARPEN_AMOUNT_LIMIT.max}
            min={SHARPEN_AMOUNT_LIMIT.min}
            onChange={(value) => setSharpenAmount(value ?? 0)}
            precision={1}
            size="small"
            step={0.1}
            value={sharpenAmount}
          />
        </div>
        <div className={styles.row}>
          <label className={styles.key} htmlFor="photo-to-3d-sharpen-radius">
            {t.photo_to_3d_sharpen_radius}
          </label>
          <InputNumber
            id="photo-to-3d-sharpen-radius"
            max={SHARPEN_RADIUS_LIMIT.max}
            min={SHARPEN_RADIUS_LIMIT.min}
            onChange={(value) => setSharpenRadius(value ?? DEFAULT_SHARPEN.radius)}
            precision={1}
            size="small"
            step={0.5}
            value={sharpenRadius}
          />
        </div>
        <p className={styles.hint}>{t.photo_to_3d_sharpen_hint}</p>
        <div className={styles.info}>
          <div className={styles.row}>
            <span className={styles.key}>{tCredit.credit_cost}</span>
            <b>{sprintf(tCredit.credit_amount, PHOTO_TO_3D_COST)}</b>
          </div>
          <div className={styles.balance}>
            <span>
              {tCredit.credit_balance}: {balance}
            </span>
            <a onClick={() => browser.open(lang.beambox.popup.ai_credit.buy_link)}>
              {lang.flux_id_login.flux_plus.goto_member_center}
            </a>
          </div>
        </div>
      </div>
    </DraggableModal>
  );
};

export default PhotoTo3dModal;
