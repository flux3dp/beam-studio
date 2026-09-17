import React, { useCallback, useState } from 'react';

import { Button } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

import OptionsPanel from './components/OptionsPanel';
import Preview from './components/Preview';
import TemplatePicker from './components/TemplatePicker';
import { exportToCanvas } from './exportToCanvas';
import styles from './StampGenerator.module.scss';
import useStampStore from './useStampStore';

interface StampGeneratorProps {
  onClose: () => void;
}

const StampGenerator = ({ onClose }: StampGeneratorProps): React.JSX.Element => {
  const { generators: tGenerators, global: tGlobal, stamp_generator: t } = useI18n();
  const [isExporting, setIsExporting] = useState(false);
  const templateId = useStampStore((s) => s.template?.id);
  const isModified = useStampStore((s) => s.isModified);
  const selectTemplate = useStampStore((s) => s.selectTemplate);

  const handleTemplateChange = useCallback(
    (newTemplateId: string) => {
      if (newTemplateId === templateId) return;

      if (!isModified) {
        selectTemplate(newTemplateId);

        return;
      }

      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        message: t.switch_template_warning,
        onYes: () => selectTemplate(newTemplateId),
        type: alertConstants.SHOW_POPUP_WARNING,
      });
    },
    [templateId, isModified, selectTemplate, t.switch_template_warning],
  );

  const handleImport = useCallback(async () => {
    setIsExporting(true);

    try {
      await exportToCanvas();
      onClose();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      console.error('Failed to export stamp to canvas:', error);
      alertCaller.popUpError({ message: `${t.export_failed}\n\n${detail}` });
    } finally {
      setIsExporting(false);
    }
  }, [onClose, t.export_failed]);

  return (
    <DraggableModal
      classNames={{ content: styles.modal }}
      footer={
        <div className={styles.footer}>
          <Button disabled={isExporting} onClick={onClose}>
            {tGlobal.cancel}
          </Button>
          <Button loading={isExporting} onClick={handleImport} type="primary">
            {tGenerators.general.import_to_canvas}
          </Button>
        </div>
      }
      maskClosable={false}
      onCancel={onClose}
      open
      title={tGenerators.stamp_generator}
    >
      <div className={styles.container}>
        <TemplatePicker currentTemplateId={templateId} onSelect={handleTemplateChange} />
        <Preview />
        <OptionsPanel />
      </div>
    </DraggableModal>
  );
};

export default StampGenerator;
