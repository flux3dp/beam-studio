import React, { useCallback, useMemo } from 'react';

import { Button, Modal } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import useI18n from '@core/helpers/useI18n';

import styles from './FileTargetSelector.module.scss';

const modelId = 'file-target-modal';

type Target = 'cloud' | 'local';

interface Props {
  resolve: (target: null | Target) => void;
  template_mode?: boolean;
}

const FileTargetSelector = ({ resolve, template_mode }: Props) => {
  const { my_cloud: tMyCloud, save_file: t } = useI18n();

  const options: Array<{ hint: string; key: Target; label: string }> = [
    { hint: t.target_local_hint, key: 'local', label: t.target_local },
    { hint: t.target_cloud_hint, key: 'cloud', label: tMyCloud.title },
  ];

  const content = useMemo(() => {
    const contents = {
      to_project: { message: t.type_project_message, title: t.type_project_title },
      to_template: { message: t.type_template_message, title: t.type_template_title },
      unchanged: { message: t.type_unchanged_message, title: t.type_unchanged_title },
    };
    const key = template_mode === undefined ? 'unchanged' : template_mode ? 'to_template' : 'to_project';

    return contents[key];
  }, [template_mode, t]);

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
