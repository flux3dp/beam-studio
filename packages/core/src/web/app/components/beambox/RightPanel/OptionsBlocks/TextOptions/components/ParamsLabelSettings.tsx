import React, { useMemo, useState } from 'react';

import { Button, Checkbox, Col, Divider, Modal, Row } from 'antd';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { useStorageStore } from '@core/app/stores/storageStore';
import type { ParamsLabelKey } from '@core/app/svgedit/text/paramsLabel';
import {
  allConfigKeys,
  getLabelKeys,
  getRecommendedConfigKeys,
  layerNameKey,
  setStorageParamsLabelKeys,
  toParamsLabelKeys,
  writeLabelKeys,
} from '@core/app/svgedit/text/paramsLabel';
import useI18n from '@core/helpers/useI18n';

import styles from './ParamsLabelSettings.module.scss';

interface Props {
  elem: SVGTextElement;
  onClose: () => void;
}

const ParamsLabelSettings = ({ elem, onClose }: Props): React.JSX.Element => {
  const { alert: tAlert, global: tGlobal, params_label: t } = useI18n();
  const [keys, setKeys] = useState<ParamsLabelKey[]>(() => getLabelKeys(elem));
  const checkedAll = keys.length === allConfigKeys.length;
  const checkedNone = keys.length === 0;
  const storedKeys = useStorageStore((state) => state['default-params-label-keys']);
  const defaultKeys = useMemo(() => toParamsLabelKeys(storedKeys), [storedKeys]);

  return (
    <Modal
      cancelText={tAlert.close}
      centered
      footer={(_, { CancelBtn, OkBtn }) => (
        <div className={styles.footer}>
          <Button className={styles.save} disabled={checkedNone} onClick={() => setStorageParamsLabelKeys(keys)}>
            {t.save_as_default}
          </Button>
          <CancelBtn />
          <OkBtn />
        </div>
      )}
      okButtonProps={{ disabled: checkedNone }}
      okText={tGlobal.apply}
      onCancel={onClose}
      onOk={() => {
        writeLabelKeys(elem, keys);
        onClose();
      }}
      open
      title={t.settings}
      width={640}
    >
      <div className={styles.actions}>
        <Checkbox
          checked={checkedAll}
          indeterminate={keys.length > 0 && !checkedAll}
          onChange={({ target }) => setKeys(target.checked ? [...allConfigKeys] : [])}
        >
          {t.check_all}
        </Checkbox>
        <Button onClick={() => setKeys(getRecommendedConfigKeys(elem))}>{t.use_recommended}</Button>
        <Button disabled={!defaultKeys} onClick={() => setKeys(defaultKeys!)}>
          {t.use_default}
        </Button>
      </div>
      <Divider />
      <Checkbox.Group className={styles.keys} onChange={(value) => setKeys(value as ParamsLabelKey[])} value={keys}>
        <Row gutter={[8, 8]}>
          {allConfigKeys.map((key) => (
            <Col key={key} span={8}>
              <Checkbox value={key}>{key === layerNameKey ? t.layer_name : key}</Checkbox>
            </Col>
          ))}
        </Row>
      </Checkbox.Group>
    </Modal>
  );
};

// eslint-disable-next-line reactRefresh/only-export-components
export const showParamsLabelSettings = (elem: SVGTextElement): void => {
  const id = `params-label-settings-${elem.id}`;

  if (isIdExist(id)) return;

  addDialogComponent(id, <ParamsLabelSettings elem={elem} onClose={() => popDialogById(id)} />);
};

export default ParamsLabelSettings;
