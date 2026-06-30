import React, { useCallback, useMemo } from 'react';

import { Button, Modal } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import { mockT } from '@core/helpers/is-dev';

import styles from './FileTargetSelector.module.scss';

const modelId = 'file-target-modal';

const contents = {
  to_project: { message: mockT('選擇專案儲存位置，儲存後將切換到專案模式'), title: mockT('儲存為專案') },
  to_template: { message: mockT('選擇模板儲存位置，儲存後將切換到模板模式'), title: mockT('儲存為模板') },
  unchanged: { message: mockT('選擇專案儲存位置'), title: mockT('儲存檔案') },
};

type Target = 'cloud' | 'local';

const options: Array<{ hint: string; key: Target; label: string }> = [
  { hint: mockT('儲存到本地裝置'), key: 'local', label: mockT('本機') },
  { hint: mockT('儲存到 Beam Studio Cloud'), key: 'cloud', label: mockT('雲端') },
];

interface Props {
  resolve: (target: null | Target) => void;
  template_mode?: boolean;
}

const FileTargetSelector = ({ resolve, template_mode }: Props) => {
  const content = useMemo(() => {
    const key = template_mode === undefined ? 'unchanged' : template_mode ? 'to_template' : 'to_project';

    return contents[key];
  }, [template_mode]);

  const onSelect = useCallback(
    (res: null | Target) => {
      resolve(res);
      dialogCaller.popDialogById(modelId);
    },
    [resolve],
  );

  return (
    <Modal
      centered
      footer={(_, { CancelBtn }) => <CancelBtn />}
      onCancel={() => onSelect(null)}
      onClose={() => onSelect(null)}
      open
      title={content.title}
    >
      <div className={styles.subtitle}>{content.message}</div>
      <div className={styles.buttons}>
        {options.map((option) => (
          <Button className={styles.button} key={option.key} onClick={() => onSelect(option.key)}>
            <div className={styles.texts}>
              <div>{option.label}</div>
              <span className={styles.hint}>{option.hint}</span>
            </div>
          </Button>
        ))}
      </div>
    </Modal>
  );
};

export default FileTargetSelector;

export const askForFileTarget = (template_mode?: boolean) => {
  return new Promise<null | Target>((resolve) => {
    dialogCaller.addDialogComponent(modelId, <FileTargetSelector resolve={resolve} template_mode={template_mode} />);
  });
};
