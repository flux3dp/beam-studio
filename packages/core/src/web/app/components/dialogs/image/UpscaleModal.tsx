import React, { useCallback, useMemo, useState } from 'react';

import { Alert } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import alertConstants from '@core/app/constants/alert-constants';
import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import imageEdit, { UPSCALE_COST } from '@core/helpers/image-edit';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './UpscaleModal.module.scss';

interface Props {
  element: SVGImageElement;
  imageSize: { height: number; width: number };
  onClose: () => void;
  requiredScale: number;
}

const SCALES = [2, 4, 6, 8, 10];
// Outputs beyond this get slow and heavy (1440² × 10x measured at 104s and a 143MB PNG); the user is warned, not blocked.
const RECOMMENDED_OUTPUT_SIZE = 8192;

const UpscaleModal = ({ element, imageSize, onClose, requiredScale }: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_upscale_panel;
  const fitRecommendedOutput = useCallback(
    (factor: number) => imageSize.width * imageSize.height * factor ** 2 <= RECOMMENDED_OUTPUT_SIZE ** 2,
    [imageSize],
  );
  // Smallest fitting option covering the layer DPI need, else the largest fitting one; never triggers the oversize alert.
  const recommended = useMemo(() => {
    if (requiredScale <= 1) return null;

    const fitting = SCALES.filter(fitRecommendedOutput);

    return fitting.find((s) => s >= requiredScale) ?? fitting.at(-1)!;
  }, [fitRecommendedOutput, requiredScale]);
  const [scale, setScale] = useState(recommended ?? SCALES[0]);
  const [failed, setFailed] = useState(false);
  const info = getCurrentUser()?.info;
  const balance = (info?.subscription?.credit ?? 0) + (info?.credit ?? 0);
  const insufficient = balance < UPSCALE_COST;
  const sizeText = (factor: number) => `${imageSize.width * factor} × ${imageSize.height * factor} px`;

  const start = async () => {
    if (!fitRecommendedOutput(scale)) {
      const proceed = await new Promise<boolean>((resolve) =>
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          message: sprintf(t.oversize_warning, sizeText(scale), RECOMMENDED_OUTPUT_SIZE, RECOMMENDED_OUTPUT_SIZE),
          onCancel: () => resolve(false),
          onConfirm: () => resolve(true),
          type: alertConstants.SHOW_POPUP_WARNING,
        }),
      );

      if (!proceed) return;
    }

    if (await imageEdit.upscaleImage(element, scale, imageSize)) {
      MessageCaller.openMessage({ content: t.done, level: MessageLevel.SUCCESS });
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
      okText={failed ? t.retry : t.start}
      onCancel={onClose}
      onOk={start}
      open
      title={lang.beambox.right_panel.object_panel.actions_panel.ai_upscale}
      width={480}
    >
      <div className={styles.upscale}>
        <p className={styles.description}>{t.description}</p>
        {insufficient && <Alert message={t.insufficient_credit} type="warning" />}
        {failed && <Alert message={t.failed} type="info" />}
        <div className={styles.label}>{lang.beambox.photo_edit_panel.scale}</div>
        <Select
          onChange={setScale}
          optionRender={({ label, value }) => (
            <div className={styles.option}>
              <span>{label}</span>
              <span className={styles.hint}>{sizeText(value as number)}</span>
            </div>
          )}
          options={SCALES.map((value) => ({
            label: value === recommended ? `${value}x (${t.recommended})` : `${value}x`,
            value,
          }))}
          popupMatchSelectWidth
          style={{ width: '100%' }}
          value={scale}
        />
        <div className={styles.info}>
          <div className={styles.row}>
            <span className={styles.key}>{t.original_size}</span>
            <span>{sizeText(1)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.key}>{t.output_size}</span>
            <span>{sizeText(scale)}</span>
          </div>
          {recommended && (
            <div className={styles.row}>
              <span className={styles.key}>{t.layer_dpi}</span>
              <span>
                {recommended >= requiredScale
                  ? sprintf(t.dpi_recommended, recommended)
                  : sprintf(t.dpi_recommended_capped, Math.min(Math.ceil(requiredScale), SCALES.at(-1)!), recommended)}
              </span>
            </div>
          )}
          <div className={styles.row}>
            <span className={styles.key}>{t.credit_cost}</span>
            <span>
              <b>{UPSCALE_COST}</b> Credit
            </span>
          </div>
          <div className={styles.balance}>
            <span>
              {t.credit_balance}: {balance}
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

export default UpscaleModal;
