import React, { useState } from 'react';

import { Alert, Button, Input, Modal, Select } from 'antd';

import {
  createPastedReplicateSample,
  PASTED_REPLICATE_MODEL_OPTIONS,
  PASTED_REPLICATE_MODELS,
  type PastedReplicateModelId,
  type ReplicatePointCloudSample,
} from '@core/helpers/image/replicatePointCloud';

import styles from './PasteReplicateResultModal.module.scss';

interface PasteReplicateResultModalProps {
  onAdd: (sample: ReplicatePointCloudSample) => void;
  onClose: () => void;
  open: boolean;
}

const PasteReplicateResultModal = ({ onAdd, onClose, open }: PasteReplicateResultModalProps): React.JSX.Element => {
  const [error, setError] = useState('');
  const [label, setLabel] = useState('');
  const [modelId, setModelId] = useState<PastedReplicateModelId>('moge2');
  const [pastedOutput, setPastedOutput] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const definition = PASTED_REPLICATE_MODELS[modelId];

  const handleAdd = (): void => {
    try {
      const sample = createPastedReplicateSample({ label, modelId, pastedOutput, sourceUrl });

      onAdd(sample);
      setError('');
      setLabel('');
      setPastedOutput('');
      setSourceUrl('');
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to parse the pasted result.');
    }
  };

  return (
    <Modal
      centered
      okButtonProps={{ disabled: !pastedOutput.trim() }}
      okText="Add to results"
      onCancel={onClose}
      onOk={handleAdd}
      open={open}
      title="Paste a Replicate result"
      width={680}
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span>Model</span>
          <Select
            onChange={(value) => {
              setError('');
              setModelId(value);
            }}
            options={PASTED_REPLICATE_MODEL_OPTIONS}
            value={modelId}
          />
        </label>
        <div className={styles.hint}>{definition.hint}</div>
        <label className={styles.field}>
          <span>Name (optional)</span>
          <Input
            onChange={(event) => setLabel(event.target.value)}
            placeholder={`${definition.label} - Test`}
            value={label}
          />
        </label>
        <label className={styles.field}>
          <span>Prediction JSON or output URL</span>
          <Input.TextArea
            className={styles.output}
            onChange={(event) => {
              setError('');
              setPastedOutput(event.target.value);
            }}
            placeholder="Paste the full JSON copied from the Replicate prediction page. A direct primary output URL is also accepted."
            rows={9}
            value={pastedOutput}
          />
        </label>
        <div className={styles.field}>
          <div className={styles.sourceHeading}>
            <span>Input image URL (only needed when it is absent from the JSON)</span>
            <div className={styles.sourceShortcuts}>
              <Button
                onClick={() => setSourceUrl('core-img/replicate-3d/test-1-standard.jpg')}
                size="small"
                type="link"
              >
                Use Test 1
              </Button>
              <Button
                onClick={() => setSourceUrl('core-img/replicate-3d/test-2-standard.jpg')}
                size="small"
                type="link"
              >
                Use Test 2
              </Button>
            </div>
          </div>
          <Input
            aria-label="Input image URL"
            onChange={(event) => {
              setError('');
              setSourceUrl(event.target.value);
            }}
            placeholder="https://replicate.delivery/.../input.jpg"
            value={sourceUrl}
          />
        </div>
        {error ? <Alert message={error} showIcon type="error" /> : null}
        <div className={styles.privacy}>
          Only parsed URLs and model metadata are saved in this browser. Do not paste an API key.
        </div>
      </div>
    </Modal>
  );
};

export default PasteReplicateResultModal;
