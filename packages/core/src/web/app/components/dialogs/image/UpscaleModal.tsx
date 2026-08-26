import { useState } from 'react';

import { Segmented } from 'antd';

import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

interface Props {
  onCancel: () => void;
  onOk: (scale: number) => void;
}

// Fineness barely improves beyond 4x, so only 2x/4x are offered.
const SCALE_OPTIONS = [2, 4].map((value) => ({ label: `${value}x`, value }));

const UpscaleModal = ({ onCancel, onOk }: Props) => {
  const lang = useI18n();
  const [scale, setScale] = useState(2);

  return (
    <DraggableModal
      cancelText={lang.global.cancel}
      maskClosable={false}
      okText={lang.global.ok}
      onCancel={onCancel}
      onOk={() => onOk(scale)}
      open
      title={
        <div className={styles['dialog-title']}>
          <ActionPanelIcons.Upscale />
          {lang.beambox.right_panel.object_panel.actions_panel.ai_upscale_short}
        </div>
      }
      width={280}
    >
      <div className={styles.field}>
        <span className={styles.label}>{lang.beambox.photo_edit_panel.scale}</span>
        <Segmented onChange={setScale} options={SCALE_OPTIONS} value={scale} />
      </div>
    </DraggableModal>
  );
};

export default UpscaleModal;
