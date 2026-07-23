import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Checkbox } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import Label from '@core/app/components/beambox/RightPanel/common/Label';
import { PopupItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import Divider from '@core/app/components/common/Divider';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsMobile } from '@core/app/stores/layoutStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import undoManager from '@core/app/svgedit/history/undoManager';
import Select from '@core/app/widgets/AntdSelect';
import DrawerV from '@core/app/widgets/AutoHeightDrawer';
import DraggableModal from '@core/app/widgets/DraggableModal';
import offsetElements from '@core/helpers/clipper/offset';
import type { CornerType, OffsetMode } from '@core/helpers/clipper/offset/constants';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import usePreviewModal from '@core/helpers/hooks/usePreviewModal';
import type { DisplayUnit } from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import styles from './OffsetModal.module.scss';

interface OffsetData {
  cornerType: CornerType;
  distances: Record<OffsetMode, number>;
  mode: OffsetMode;
}

const defaultDistances: Record<DisplayUnit, Record<OffsetMode, number>> = {
  // inch: { expand: 0.002, inward: 0.2, outward: 0.2, shrink: 0.002 }, // data in inch
  inch: { expand: 0.0508, inward: 5.08, outward: 5.08, shrink: 0.0508 }, // data in mm
  mm: { expand: 0.05, inward: 3, outward: 3, shrink: 0.05 },
};

const optionConfig: NumberOptionConfig = {
  id: 'offset-distance',
  min: 0,
  precision: 2,
  sliderMax: 100,
  sliderStep: 0.1,
  unit: 'mm',
};
const optionConfigInch: NumberOptionConfig = {
  ...optionConfig,
  sliderMax: 101.6,
  sliderStep: 0.127,
  step: 1.27,
  unit: 'in',
};

// In-memory storage for offset config (persists across modal open/close, resets on page reload).
let sessionConfig: null | { data: OffsetData } = null;

interface UseOffsetOptions {
  onClose: () => void;
}

const useOffset = ({ onClose }: UseOffsetOptions) => {
  const {
    beambox: { tool_panels: lang },
    global: tGlobal,
  } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const unit = isInch ? 'inch' : 'mm';
  const config = isInch ? optionConfigInch : optionConfig;
  const isClosing = useRef(false);

  useNewShortcutsScope();

  const [data, setData] = useState<OffsetData>(
    () => sessionConfig?.data ?? { cornerType: 'round', distances: { ...defaultDistances[unit] }, mode: 'outward' },
  );

  // Save config to in-memory store on change
  useEffect(() => {
    sessionConfig = { data };
  }, [data]);

  // Preview generation function
  const generatePreview = useCallback(async () => {
    if (isClosing.current) return null;

    const { cornerType, distances, mode } = data;
    const { dpmm } = constant;

    return offsetElements(mode, distances[mode] * dpmm, cornerType, undefined, { addToHistory: false });
  }, [data]);

  const { cancelPreview, commitPreview, handlePreview, previewEnabled, setPreviewEnabled } = usePreviewModal({
    generatePreview,
    isClosing,
    key: 'offset',
    selectionMode: 'inserted',
  });

  const updateValue = useCallback((val: null | number) => {
    if (val === null) return;

    setData((prev) => ({ ...prev, distances: { ...prev.distances, [prev.mode]: val } }));
  }, []);

  // Generate preview on mount and when data/unit/previewEnabled changes
  useEffect(() => {
    if (isClosing.current) return;

    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [data.distances[data.mode], previewEnabled]);

  const close = useCallback(() => {
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

  const content = useMemo(
    () => (
      <>
        <div className={styles.field}>
          <Label className={styles.label}>{lang._offset.direction}</Label>
          <Select
            className={styles.select}
            onChange={(val: OffsetMode) => setData((prev) => ({ ...prev, mode: val }))}
            options={[
              { label: lang._offset.outward, value: 'outward' },
              { label: lang._offset.inward, value: 'inward' },
            ]}
            popupMatchSelectWidth={false}
            value={data.mode}
          />
        </div>
        <div className={styles.field}>
          <Label className={styles.label}>{lang._offset.corner_type}</Label>
          <Select
            className={styles.select}
            data-testid="offset-corner"
            onChange={(val) => setData((prev) => ({ ...prev, cornerType: val }))}
            options={[
              { label: lang._offset.round, value: 'round' },
              { label: lang._offset.sharp, value: 'sharp' },
            ]}
            popupMatchSelectWidth={false}
            value={data.cornerType}
          />
        </div>
        <Divider marginBottom={12} marginTop={12} />
        <div className={styles.field}>
          <Label className={styles.label}>{lang._offset.dist}</Label>
          <Slider config={config} isInch={isInch} noRevert onChange={updateValue} value={data.distances[data.mode]} />
          <InputNumberGroup config={config} isInch={isInch} onChange={updateValue} value={data.distances[data.mode]} />
        </div>
      </>
    ),
    [data.cornerType, data.distances, data.mode, lang, isInch, config, updateValue],
  );

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
        <Button onClick={handleCancel}>{lang.cancel}</Button>
        <Button onClick={onOk} type="primary">
          {lang.confirm}
        </Button>
      </div>
    ),
    [handleCancel, lang.cancel, lang.confirm, onOk, previewEnabled, setPreviewEnabled, tGlobal.preview],
  );

  return { content, footer, handleCancel, title: lang.offset };
};

interface OffsetPanelContentProps {
  objectPanelKey: string;
  onClose: () => void;
  reference: Element | null;
}

export const OffsetPopup = ({
  objectPanelKey,
  onClose: propsOnClose,
  reference,
}: OffsetPanelContentProps): React.JSX.Element => {
  const onClose = useCallback(() => {
    propsOnClose();

    if (useSelectedElementStore.getState().activeKey === objectPanelKey) {
      useSelectedElementStore.setState({ activeKey: null });
    }
  }, [propsOnClose, objectPanelKey]);
  const { content, footer, handleCancel, title } = useOffset({ onClose });

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

const OffsetModal = ({ onClose }: Props): React.JSX.Element => {
  const isMobile = useIsMobile();
  const { content, footer, handleCancel, title } = useOffset({ onClose });

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
      width={350}
      xRef="left"
      yRef="bottom"
    >
      {content}
    </DraggableModal>
  );
};

export const showOffsetModal = (): void => {
  const id = 'offset-modal';

  if (isIdExist(id)) return;

  addDialogComponent(id, <OffsetModal onClose={() => popDialogById(id)} />);
};

export default OffsetModal;
