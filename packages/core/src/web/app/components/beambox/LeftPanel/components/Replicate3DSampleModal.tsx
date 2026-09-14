import React, { useState } from 'react';

import { Alert, Button, Image, Modal, Segmented, Tag } from 'antd';
import { match } from 'ts-pattern';

import {
  REPLICATE_POINT_CLOUD_SAMPLES,
  type ReplicatePointCloudSample,
  type ReplicateSampleDisplay,
} from '@core/helpers/image/replicatePointCloud';
import { isUvDev2 } from '@core/helpers/is-dev';

import PasteReplicateResultModal from './PasteReplicateResultModal';
import styles from './Replicate3DSampleModal.module.scss';

void isUvDev2();

interface Replicate3DSampleModalProps {
  onClose: () => void;
  onSelect: (sample: ReplicatePointCloudSample, display: ReplicateSampleDisplay) => void;
}

const DISPLAY_LABEL: Record<ReplicateSampleDisplay, string> = {
  'point-cloud': 'Point cloud',
  'reference-mesh': 'Reference mesh',
  'relief-mesh': 'Relief mesh',
};

type SampleFilter = 'all' | 'captured-test' | 'pasted-result' | 'public-example';

const PASTED_SAMPLE_STORAGE_KEY = 'beam-studio-replicate-3d-pasted-results-v1';
const MAX_PASTED_SAMPLES = 12;

const isPastedSample = (value: unknown): value is ReplicatePointCloudSample => {
  if (!value || typeof value !== 'object') return false;

  const sample = value as Partial<ReplicatePointCloudSample>;

  return (
    sample.group === 'pasted-result' &&
    typeof sample.id === 'string' &&
    typeof sample.label === 'string' &&
    typeof sample.outputUrl === 'string' &&
    Array.isArray(sample.displays) &&
    typeof sample.source?.url === 'string'
  );
};

const loadPastedSamples = (): ReplicatePointCloudSample[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(PASTED_SAMPLE_STORAGE_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;

    return Array.isArray(parsed) ? parsed.filter(isPastedSample).slice(0, MAX_PASTED_SAMPLES) : [];
  } catch {
    return [];
  }
};

const savePastedSamples = (samples: ReadonlyArray<ReplicatePointCloudSample>): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(PASTED_SAMPLE_STORAGE_KEY, JSON.stringify(samples));
  } catch {
    // The current modal session remains usable if browser storage is unavailable.
  }
};

const renderPreview = (preview: ReplicatePointCloudSample['inputPreview'], alt: string): React.JSX.Element =>
  match(preview)
    .with({ kind: 'image' }, ({ url }) => <Image alt={alt} loading="lazy" src={url} />)
    .with({ kind: 'video' }, ({ url }) => <video aria-label={alt} muted playsInline preload="metadata" src={url} />)
    .exhaustive();

const getCommercialUseLabel = (sample: ReplicatePointCloudSample): string =>
  match(sample.commercialUse)
    .with(true, () => 'Commercial use')
    .with(false, () => 'Non-commercial')
    .with('review', () => 'Review terms')
    .exhaustive();

const renderRunMetrics = (sample: ReplicatePointCloudSample): null | React.JSX.Element => {
  const metrics = sample.runMetrics;

  if (!metrics) return null;

  return (
    <div className={styles.runMetrics}>
      {metrics.queued ? <span>Queue {metrics.queued}</span> : null}
      {metrics.running ? <span>Run {metrics.running}</span> : null}
      {metrics.total ? <span>Total {metrics.total}</span> : null}
    </div>
  );
};

const Replicate3DSampleModal = ({ onClose, onSelect }: Replicate3DSampleModalProps): React.JSX.Element => {
  const [pastedSamples, setPastedSamples] = useState<ReplicatePointCloudSample[]>(loadPastedSamples);
  const [filter, setFilter] = useState<SampleFilter>(pastedSamples.length ? 'pasted-result' : 'captured-test');
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const samples: ReadonlyArray<ReplicatePointCloudSample> = [...pastedSamples, ...REPLICATE_POINT_CLOUD_SAMPLES];
  const visibleSamples = samples.filter((sample) => {
    if (filter === 'all') return true;

    return (sample.group ?? 'public-example') === filter;
  });
  const addPastedSample = (sample: ReplicatePointCloudSample): void => {
    setPastedSamples((current) => {
      const next = [sample, ...current].slice(0, MAX_PASTED_SAMPLES);

      savePastedSamples(next);

      return next;
    });
    setFilter('pasted-result');
  };
  const removePastedSample = (id: string): void => {
    setPastedSamples((current) => {
      const next = current.filter((sample) => sample.id !== id);

      savePastedSamples(next);

      return next;
    });
  };

  return (
    <>
      <Modal centered footer={null} onCancel={onClose} open title="Captured 2D to 3D results" width={1040}>
        <div className={styles.intro}>
          <Alert message="本區塊主要用於展示測試模型效果，還沒有確認最終使用哪個版本的模式" showIcon type="info" />
        </div>
        <div className={styles.toolbar}>
          <div className={styles.toolbarControls}>
            <Segmented
              onChange={(value) => setFilter(value as SampleFilter)}
              options={[
                { label: `Pasted (${pastedSamples.length})`, value: 'pasted-result' },
                { label: 'Captured tests', value: 'captured-test' },
                { label: 'Public examples', value: 'public-example' },
                { label: 'All', value: 'all' },
              ]}
              value={filter}
            />
            <Button onClick={() => setPasteModalOpen(true)} type="primary">
              Paste result
            </Button>
          </div>
          <span>{visibleSamples.length} results</span>
        </div>
        <div className={styles.list}>
          {visibleSamples.map((sample) => {
            const disabled = sample.availability !== 'importable';
            const failed = disabled && sample.displays.length === 0;

            return (
              <article className={styles.card} key={sample.id}>
                <div className={styles.preview}>
                  <div className={styles.previewItem}>
                    <span>Input</span>
                    {renderPreview(sample.inputPreview, `${sample.label} input`)}
                  </div>
                  {sample.resultPreview ? (
                    <div className={styles.previewItem}>
                      <span>{sample.resultPreview.label ?? 'Output'}</span>
                      {renderPreview(sample.resultPreview, `${sample.label} output`)}
                    </div>
                  ) : null}
                </div>
                <div className={styles.content}>
                  <div className={styles.heading}>
                    <div>
                      <div className={styles.label}>{sample.label}</div>
                      <div className={styles.model}>{sample.model}</div>
                    </div>
                    <Tag color={failed ? 'red' : disabled ? 'default' : 'green'}>
                      {failed ? 'Failed' : disabled ? 'Preview only' : 'Ready'}
                    </Tag>
                  </div>
                  <div className={styles.metadata}>
                    <span>{sample.runMetrics?.cost ?? `~US$${sample.approximateCostUsd}`}</span>
                    <span>{sample.license}</span>
                    <span>{getCommercialUseLabel(sample)}</span>
                  </div>
                  {renderRunMetrics(sample)}
                  {sample.resultNote ? <div className={styles.resultNote}>{sample.resultNote}</div> : null}
                  {sample.disabledReason ? <div className={styles.disabledReason}>{sample.disabledReason}</div> : null}
                  <div className={styles.actions}>
                    {sample.displays.map((display) => (
                      <Button
                        disabled={disabled}
                        key={display}
                        onClick={() => onSelect(sample, display)}
                        title={disabled ? sample.disabledReason : `${sample.label} — ${DISPLAY_LABEL[display]}`}
                        type="primary"
                      >
                        {DISPLAY_LABEL[display]}
                      </Button>
                    ))}
                    {sample.group === 'pasted-result' ? (
                      <Button danger onClick={() => removePastedSample(sample.id)} size="small" type="text">
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
          {visibleSamples.length === 0 ? (
            <div className={styles.empty}>
              <span>No pasted results yet.</span>
              <Button onClick={() => setPasteModalOpen(true)} type="primary">
                Paste the first result
              </Button>
            </div>
          ) : null}
        </div>
      </Modal>
      <PasteReplicateResultModal
        onAdd={addPastedSample}
        onClose={() => setPasteModalOpen(false)}
        open={pasteModalOpen}
      />
    </>
  );
};

export default Replicate3DSampleModal;
