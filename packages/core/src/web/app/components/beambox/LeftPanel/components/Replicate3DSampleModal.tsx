import React from 'react';

import { Button, Modal, Tag } from 'antd';
import { match } from 'ts-pattern';

import {
  REPLICATE_POINT_CLOUD_SAMPLES,
  type ReplicatePointCloudSample,
  type ReplicatePointCloudSampleId,
  type ReplicateSampleDisplay,
} from '@core/helpers/image/replicatePointCloud';

import styles from './Replicate3DSampleModal.module.scss';

interface Replicate3DSampleModalProps {
  onClose: () => void;
  onSelect: (id: ReplicatePointCloudSampleId, display: ReplicateSampleDisplay) => void;
}

const DISPLAY_LABEL: Record<ReplicateSampleDisplay, string> = {
  'point-cloud': 'Point cloud',
  'relief-mesh': 'Relief mesh',
};

const renderInputPreview = (sample: ReplicatePointCloudSample): React.JSX.Element =>
  match(sample.inputPreview)
    .with({ kind: 'image' }, ({ url }) => <img alt={`${sample.label} input`} loading="lazy" src={url} />)
    .with({ kind: 'video' }, ({ url }) => (
      <video aria-label={`${sample.label} input`} muted playsInline preload="metadata" src={url} />
    ))
    .exhaustive();

const getCommercialUseLabel = (sample: ReplicatePointCloudSample): string =>
  match(sample.commercialUse)
    .with(true, () => 'Commercial use')
    .with(false, () => 'Non-commercial')
    .with('review', () => 'Review terms')
    .exhaustive();

const Replicate3DSampleModal = ({ onClose, onSelect }: Replicate3DSampleModalProps): React.JSX.Element => (
  <Modal centered footer={null} onCancel={onClose} open title="Captured 2D to 3D results" width={920}>
    <div className={styles.intro}>
      When supported, select the same captured model result as a point cloud or relief mesh. No Replicate request is
      made by Beam Studio.
    </div>
    <div className={styles.list}>
      {REPLICATE_POINT_CLOUD_SAMPLES.map((sample) => {
        const disabled = sample.availability !== 'importable';

        return (
          <article className={styles.card} key={sample.id}>
            <div className={styles.preview}>{renderInputPreview(sample)}</div>
            <div className={styles.content}>
              <div className={styles.heading}>
                <div>
                  <div className={styles.label}>{sample.label}</div>
                  <div className={styles.model}>{sample.model}</div>
                </div>
                <Tag color={disabled ? 'default' : 'green'}>{disabled ? 'Preview only' : 'Ready'}</Tag>
              </div>
              <div className={styles.metadata}>
                <span>~US${sample.approximateCostUsd}</span>
                <span>{sample.license}</span>
                <span>{getCommercialUseLabel(sample)}</span>
              </div>
              {sample.disabledReason ? <div className={styles.disabledReason}>{sample.disabledReason}</div> : null}
              <div className={styles.actions}>
                {sample.displays.map((display) => (
                  <Button
                    disabled={disabled}
                    key={display}
                    onClick={() => onSelect(sample.id, display)}
                    title={disabled ? sample.disabledReason : `${sample.label} — ${DISPLAY_LABEL[display]}`}
                    type="primary"
                  >
                    {DISPLAY_LABEL[display]}
                  </Button>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  </Modal>
);

export default Replicate3DSampleModal;
