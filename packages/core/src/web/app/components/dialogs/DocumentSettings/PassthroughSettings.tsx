import { useCallback, useEffect, useMemo, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import { getAddOnInfo } from '@core/app/constants/addOn';
import { getWorkarea, type WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './PassthroughSettings.module.scss';

interface Props {
  /**
   * true for passthrough, false for auto feeder
   */
  isManualMode?: boolean;
  onClose: () => void;
  onSave?: () => void;
  workarea?: WorkAreaModel;
}

export const PassthroughSettings = ({ isManualMode, onClose, onSave, workarea }: Props) => {
  const {
    beambox: { document_panel: tDocument },
    global: tGlobal,
  } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const { autoFeederMaxHeight, minHeight } = useMemo(() => {
    const targetWorkarea = workarea ?? useDocumentStore.getState().workarea;
    const workareaObject = getWorkarea(targetWorkarea);
    const addOnInfo = getAddOnInfo(targetWorkarea);

    return {
      autoFeederMaxHeight: addOnInfo.autoFeeder?.maxHeight,
      minHeight: workareaObject.displayHeight ?? workareaObject.height,
    };
  }, [workarea]);
  const [autoFeederHeight, setAutoFeederHeight] = useState(
    useDocumentStore.getState()['auto-feeder-height'] ?? minHeight,
  );
  const [autoFeederScale, setAutoFeederScale] = useState(useDocumentStore.getState()['auto-feeder-scale']);
  const [passThroughHeight, setPassThroughHeight] = useState(
    useDocumentStore.getState()['pass-through-height'] ?? minHeight,
  );

  useEffect(() => {
    if (isManualMode) setPassThroughHeight((cur) => Math.max(cur, minHeight));
  }, [minHeight, isManualMode]);
  useEffect(() => {
    if (!isManualMode) {
      setAutoFeederHeight((cur) => Math.min(autoFeederMaxHeight ?? cur, Math.max(minHeight, cur)));
    }
  }, [minHeight, autoFeederMaxHeight, isManualMode]);

  const handleSave = useCallback(() => {
    if (isManualMode) {
      useDocumentStore.getState().update({ 'pass-through-height': passThroughHeight });
    } else {
      useDocumentStore.getState().update({
        'auto-feeder-height': autoFeederHeight,
        'auto-feeder-scale': autoFeederScale,
      });
    }

    onSave?.();
    onClose();
  }, [onClose, onSave, isManualMode, passThroughHeight, autoFeederHeight, autoFeederScale]);

  return (
    <DraggableModal
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={handleSave}
      open
      scrollableContent
      title={`${tDocument.pass_through} (${isManualMode ? tDocument.manual : tDocument.auto_feeder})`}
      width={410}
    >
      <div className={styles.container}>
        {isManualMode ? (
          <>
            <label className={styles.title}>{tDocument.extend_y_area}</label>
            <div className={styles.control}>
              <UnitInput
                addonAfter={isInch ? 'in' : 'mm'}
                className={styles.input}
                clipValue
                id="pass_through_height"
                isInch={isInch}
                min={minHeight}
                onChange={(val) => {
                  if (val) setPassThroughHeight(val);
                }}
                precision={isInch ? 2 : 0}
                size="small"
                value={passThroughHeight}
              />
              <Tooltip title={tDocument.pass_through_height_desc}>
                <QuestionCircleOutlined className={styles.hint} />
              </Tooltip>
            </div>
          </>
        ) : (
          <>
            <label className={styles.title}>{tDocument.extend_y_area}</label>
            <div className={styles.control}>
              <UnitInput
                addonAfter={isInch ? 'in' : 'mm'}
                className={styles.input}
                clipValue
                id="auto_feeder_height"
                isInch={isInch}
                max={autoFeederMaxHeight}
                min={minHeight}
                onChange={(val) => {
                  if (val) setAutoFeederHeight(val);
                }}
                precision={isInch ? 2 : 0}
                size="small"
                value={autoFeederHeight}
              />
              <QuestionCircleOutlined className={styles.hint} onClick={() => browser.open(tDocument.auto_feeder_url)} />
            </div>
            <label className={styles.title}>{tDocument.scale}</label>
            <div className={styles.control}>
              <Select
                className={styles.select}
                id="auto_feeder_scale"
                onChange={(val) => setAutoFeederScale(val)}
                options={[
                  { label: 0.5, value: 0.5 },
                  { label: 1.0, value: 1.0 },
                  { label: 1.5, value: 1.5 },
                  { label: 2.0, value: 2.0 },
                ]}
                value={autoFeederScale}
              />
            </div>
          </>
        )}
      </div>
    </DraggableModal>
  );
};
