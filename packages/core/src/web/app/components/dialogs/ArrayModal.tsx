import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Checkbox } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import Label from '@core/app/components/beambox/RightPanel/common/Label';
import { PopupItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsMobile } from '@core/app/stores/layoutStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import undoManager from '@core/app/svgedit/history/undoManager';
import { generateSelectedElementArray } from '@core/app/svgedit/operations/clipboard';
import DrawerV from '@core/app/widgets/AutoHeightDrawer';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import usePreviewModal from '@core/helpers/hooks/usePreviewModal';
import type { DisplayUnit } from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import styles from './ArrayModal.module.scss';

interface ArrayData {
  column: number;
  dx: number;
  dy: number;
  row: number;
}

const defaultDistances: Record<DisplayUnit, number> = {
  // inch: 1, // data in inch
  inch: 25.4, // data in mm
  mm: 20,
};

const optionConfig: NumberOptionConfig = {
  min: 0,
  precision: 2,
  sliderMax: 100,
  sliderStep: 0.1,
  unit: 'mm',
};
const optionConfigInch: NumberOptionConfig = {
  ...optionConfig,
  sliderMax: 101.6,
  sliderStep: 0.254,
  step: 2.54,
  unit: 'in',
};
const dimensionConfig: NumberOptionConfig = {
  min: 1,
  precision: 0,
  sliderMax: 10,
};

// In-memory storage for array config (persists across modal open/close, resets on page reload).
let sessionConfig: null | { data: ArrayData } = null;

interface UseArrayOptions {
  onClose: () => void;
}

const useArray = ({ onClose }: UseArrayOptions) => {
  const {
    beambox: { tool_panels: t },
    global: tGlobal,
  } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const unit = isInch ? 'inch' : 'mm';
  const distanceConfig = isInch ? optionConfigInch : optionConfig;
  const isClosing = useRef(false);

  useNewShortcutsScope();

  const [data, setData] = useState<ArrayData>(
    () => sessionConfig?.data ?? { column: 3, dx: defaultDistances[unit], dy: defaultDistances[unit], row: 3 },
  );

  // Save config to in-memory store on change
  useEffect(() => {
    sessionConfig = { data };
  }, [data]);

  // Preview generation function
  const generatePreview = useCallback(async () => {
    if (isClosing.current) return null;

    const toPixel = (val: number) => val * constant.dpmm;

    return generateSelectedElementArray(
      { dx: toPixel(data.dx), dy: toPixel(data.dy) },
      { column: data.column, row: data.row },
      { addToHistory: false },
    );
  }, [data]);

  const { cancelPreview, commitPreview, handlePreview, previewEnabled, setPreviewEnabled } = usePreviewModal({
    generatePreview,
    isClosing,
    key: 'array',
    selectionMode: 'all',
  });

  // Unified state updater
  const updateValue = useCallback(
    (key: keyof ArrayData) => (val: null | number) => {
      const isCountField = key === 'column' || key === 'row';
      const defaultValue = isCountField ? 1 : 0;

      setData((prev) => ({ ...prev, [key]: val ?? defaultValue }));
    },
    [],
  );

  // Generate preview on mount and when data/unit/previewEnabled changes
  useEffect(() => {
    if (isClosing.current) return;

    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [data, unit, previewEnabled]);

  const close = useCallback(() => {
    isClosing.current = true;
    onClose();
    setMouseMode('select');
  }, [onClose]);

  const onOk = useCallback(async () => {
    const cmd = await commitPreview();

    if (cmd && !cmd.isEmpty()) {
      undoManager.addCommandToHistory(cmd);
      currentFileManager.setHasUnsavedChanges(true);
    }

    close();
  }, [close, commitPreview]);

  const handleCancel = useCallback(() => {
    isClosing.current = true;
    cancelPreview();
    close();
  }, [cancelPreview, close]);

  const content = useMemo(() => {
    const renderField = (label: string, key: keyof ArrayData, config: NumberOptionConfig, isLengthField = false) => (
      <div className={styles.field} key={key}>
        <Label className={styles.label}>{label}</Label>
        <Slider
          config={config}
          isInch={isInch && isLengthField}
          noRevert
          onChange={updateValue(key)}
          value={data[key]}
        />
        <InputNumberGroup
          addonAfter={config.unit}
          className={styles.input}
          config={config}
          data-testid={key}
          isInch={isInch && isLengthField}
          onChange={updateValue(key)}
          value={data[key]}
        />
      </div>
    );

    return (
      <>
        <div className={styles['section-header']}>
          <span className={styles['section-title']}>{t.array_dimension}</span>
          <div className={styles.line} />
        </div>
        {renderField(t.columns, 'column', dimensionConfig)}
        {renderField(t.rows, 'row', dimensionConfig)}

        <div className={styles['section-header']}>
          <span className={styles['section-title']}>{t.array_interval}</span>
          <div className={styles.line} />
        </div>
        {renderField('X', 'dx', distanceConfig, true)}
        {renderField('Y', 'dy', distanceConfig, true)}
      </>
    );
  }, [data, distanceConfig, isInch, t, updateValue]);

  const footer = useMemo(
    () => (
      <div className={styles.footer}>
        <Checkbox
          checked={previewEnabled}
          className={styles.checkbox}
          onChange={(e) => setPreviewEnabled(e.target.checked)}
        >
          {tGlobal.preview}
        </Checkbox>
        <Button onClick={handleCancel}>{t.cancel}</Button>
        <Button onClick={onOk} type="primary">
          {t.confirm}
        </Button>
      </div>
    ),
    [handleCancel, onOk, previewEnabled, setPreviewEnabled, t.cancel, t.confirm, tGlobal.preview],
  );

  return { content, footer, handleCancel, previewEnabled, title: t.grid_array };
};

interface ArrayPanelContentProps {
  objectPanelKey: string;
  onClose: () => void;
  reference: Element | null;
}

export const ArrayPopup = ({
  objectPanelKey,
  onClose: propsOnClose,
  reference,
}: ArrayPanelContentProps): React.JSX.Element => {
  const onClose = useCallback(() => {
    propsOnClose();

    if (useSelectedElementStore.getState().activeKey === objectPanelKey) {
      useSelectedElementStore.setState({ activeKey: null });
    }
  }, [propsOnClose, objectPanelKey]);
  const { content, footer, handleCancel, title } = useArray({ onClose });

  useEffect(
    () => () => {
      if (useSelectedElementStore.getState().activeKey !== objectPanelKey) {
        handleCancel();
      }
    },
    [handleCancel, objectPanelKey],
  );

  return (
    <PopupItem footer={footer} id={objectPanelKey} reference={reference} renderContent={() => content} title={title} />
  );
};

interface Props {
  onClose: () => void;
}

const ArrayModal = ({ onClose }: Props): React.JSX.Element => {
  const isMobile = useIsMobile();
  const { content, footer, handleCancel, title } = useArray({ onClose });

  return isMobile ? (
    <DrawerV
      footer={footer}
      getContainer={() => document.querySelector('#svg_editor') ?? document.body}
      onClose={handleCancel}
      open
      title={title}
    >
      {content}
    </DrawerV>
  ) : (
    <DraggableModal
      className={styles.modal}
      defaultPosition={{ x: 60, y: -60 }}
      footer={footer}
      maskClosable={false}
      onCancel={handleCancel}
      open
      title={title}
      width={280}
      xRef="left"
      yRef="bottom"
    >
      {content}
    </DraggableModal>
  );
};

export const showArrayModal = (): void => {
  const id = 'array-modal';

  if (isIdExist(id)) return;

  addDialogComponent(id, <ArrayModal onClose={() => popDialogById(id)} />);
};

export default ArrayModal;
