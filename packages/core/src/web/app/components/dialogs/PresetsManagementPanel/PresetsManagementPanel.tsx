/* eslint-disable no-nested-ternary */
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Modal } from 'antd';
import { DownloadOutlined, PlusCircleFilled, UploadOutlined } from '@ant-design/icons';

import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import ConfigPanelIcons from 'app/icons/config-panel/ConfigPanelIcons';
import dialogCaller from 'app/actions/dialog-caller';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import layerModuleHelper from 'helpers/layer-module/layer-module-helper';
import presets from 'app/constants/presets';
import presetHelper from 'helpers/presets/preset-helper';
import Select from 'app/widgets/AntdSelect';
import storage from 'implementations/storage';
import useI18n from 'helpers/useI18n';
import useWorkarea from 'helpers/hooks/useWorkarea';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { ConfigKey, ConfigKeyTypeMap, Preset } from 'interfaces/ILayerConfig';
import { baseConfig, getDefaultConfig, postPresetChange } from 'helpers/layer/layer-config-helper';
import { getWorkarea } from 'app/constants/workarea-constants';
import { promarkModels } from 'app/actions/beambox/constant';

import Footer from './Footer';
import LaserInputs from './LaserInputs';
import PresetList from './PresetList';
import PrintingInputs from './PrintingInputs';
import PromarkInputs from './PromarkInputs';
import styles from './PresetsManagementPanel.module.scss';

enum Filter {
  ALL = '0',
  LASER = '1',
  PRINT = '2',
}

interface Props {
  currentModule: LayerModule;
  initPreset?: string;
  onClose: () => void;
}

const PresetsManagementPanel = ({ currentModule, initPreset, onClose }: Props): JSX.Element => {
  const lang = useI18n();
  const tLaserPanel = lang.beambox.right_panel.laser_panel;
  const t = tLaserPanel.preset_management;
  const workarea = useWorkarea();
  const workareaObj = useMemo(() => getWorkarea(workarea), [workarea]);
  const hasModule = useMemo(() => modelsWithModules.has(workarea), [workarea]);
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const [filter, setFilter] = useState(hasModule ? Filter.ALL : Filter.LASER);
  const listRef = useRef<HTMLDivElement>(null);
  const isInch = useMemo(() => (storage.get('default-units') || 'mm') === 'inches', []);
  const lengthUnit = useMemo(() => (isInch ? 'in' : 'mm'), [isInch]);
  const moduleTranslations = useMemo(() => layerModuleHelper.getModulesTranslations(), []);
  const [editingPresets, setEditingPresets] = useState(presetHelper.getAllPresets());
  const [editingValues, setEditingValues] = useState<Record<string, Preset>>({});
  const displayList = useMemo(
    () =>
      editingPresets.filter((c) => {
        if (!c.isDefault) {
          if (filter === Filter.ALL) return true;
          return c.module === LayerModule.PRINTER
            ? filter === Filter.PRINT
            : filter === Filter.LASER;
        }
        const hasPreset = presetHelper.modelHasPreset(workarea, c.key);
        if (!hasPreset) return false;
        if (filter === Filter.ALL || !hasModule) return true;
        const isPrintingPreset = Boolean(
          presetHelper.getDefaultPreset(c.key, workarea, LayerModule.PRINTER)
        );
        return isPrintingPreset ? filter === Filter.PRINT : filter === Filter.LASER;
      }),
    [workarea, hasModule, editingPresets, filter]
  );
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(
    initPreset
      ? displayList.find((p) => initPreset === p.name || initPreset === p.key) ?? displayList[0]
      : displayList[0]
  );
  useEffect(() => {
    if (!selectedPreset || !listRef.current) return;
    const { key, name, isDefault } = selectedPreset;
    const item = listRef.current.querySelector(`[data-key="${isDefault ? key : name}"]`);
    if (!item) return;
    const { offsetTop, scrollTop, clientHeight: listHeight } = listRef.current;
    const { offsetTop: itemTop, clientHeight: itemHeight } = item as HTMLElement;
    const listTop = offsetTop + scrollTop;
    const itemBottom = itemTop + itemHeight;
    const listBottom = listTop + listHeight;
    if (itemBottom < listTop || itemTop > listBottom) {
      item?.scrollIntoView({ behavior: 'auto' });
    }
  }, [selectedPreset]);
  const availableModules = useMemo(() => {
    if (selectedPreset?.isDefault && hasModule) {
      return Object.keys(presets[selectedPreset.key]?.[workarea] || {}).map((m) => parseInt(m, 10));
    }
    return [];
  }, [workarea, hasModule, selectedPreset]);
  const [selectedModule, setSelectedModule] = useState(currentModule);
  useEffect(() => {
    if (availableModules.length > 0) {
      setSelectedModule((cur) => {
        if (availableModules.includes(cur)) return cur;
        return availableModules[0];
      });
    } else if (selectedPreset?.module) {
      setSelectedModule(selectedPreset.module);
    }
  }, [availableModules, selectedPreset]);
  const displayPreset = useMemo(() => {
    if (!selectedPreset) return { name: '', isDefault: true };
    if (!selectedPreset.isDefault)
      return { ...selectedPreset, ...editingValues[selectedPreset.name] };
    const presetModel = presetHelper.getPresetModel(workarea);
    const keyPresets = presets[selectedPreset.key]?.[presetModel];
    if (!keyPresets) return selectedPreset;
    if (keyPresets[selectedModule]) return { ...selectedPreset, ...keyPresets[selectedModule] };
    return { ...selectedPreset, ...Object.values(keyPresets)[0] };
  }, [workarea, selectedPreset, selectedModule, editingValues]);

  const handleChange = <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T]) => {
    const { name, isDefault } = selectedPreset;
    if (isDefault) return;
    const editing = editingValues[name] || {};
    const origValue = selectedPreset[key];
    if (origValue === value) {
      delete editing[key];
      if (Object.keys(editing).length === 0) {
        delete editingValues[name];
      }
    } else {
      editing[key] = value;
      editingValues[name] = editing;
    }
    setEditingValues({ ...editingValues });
  };

  const toggleHidePreset = (preset: Preset) => {
    // eslint-disable-next-line no-param-reassign
    preset.hide = !preset.hide;
    setEditingPresets([...editingPresets]);
  };
  const isPrinting = useMemo(() => displayPreset.module === LayerModule.PRINTER, [displayPreset]);

  const handleDelete = () => {
    if (selectedPreset.isDefault) return;
    const displayIdx = displayList.findIndex((p) => p === selectedPreset);
    const newPresets = editingPresets.filter((p) => p !== selectedPreset);
    setSelectedPreset(displayList[displayIdx === 0 ? 1 : displayIdx - 1]);
    setEditingPresets(newPresets);
  };

  const getCurrentPresets = useCallback(() => {
    const res = [...editingPresets];
    for (let i = 0; i < res.length; i += 1) {
      const { name, isDefault } = editingPresets[i];
      if (editingValues[name] && !isDefault) {
        res[i] = { ...editingPresets[i], ...editingValues[name] };
      } else {
        res[i] = { ...editingPresets[i] };
      }
    }
    return res;
  }, [editingPresets, editingValues]);

  const handleSave = useCallback(() => {
    presetHelper.savePresetList(getCurrentPresets());
    postPresetChange();
    onClose();
  }, [getCurrentPresets, onClose]);

  const handleImport = useCallback(async () => {
    const res = await presetHelper.importPresets();
    if (res) {
      const newPresets = presetHelper.getAllPresets();
      setEditingPresets(newPresets);
      setSelectedPreset(newPresets[0]);
    }
  }, []);

  const handleExport = useCallback(() => {
    presetHelper.exportPresets(getCurrentPresets());
  }, [getCurrentPresets]);

  const handleReset = useCallback(() => {
    alertCaller.popUp({
      type: alertConstants.WARNING,
      message: t.sure_to_reset,
      buttonType: alertConstants.CONFIRM_CANCEL,
      onConfirm: () => {
        presetHelper.resetPresetList();
        postPresetChange();
        onClose();
      },
    });
  }, [t, onClose]);

  const handleAddPreset = async () => {
    let presetModule = LayerModule.LASER_UNIVERSAL;
    if (hasModule) {
      presetModule = await dialogCaller.showRadioSelectDialog({
        id: 'import-module',
        title: lang.beambox.popup.select_import_module,
        options: [
          { label: t.laser, value: LayerModule.LASER_UNIVERSAL },
          { label: t.print, value: LayerModule.PRINTER },
        ],
      });
      if (!presetModule) return;
    }
    const name = await new Promise<string>((resolve) => {
      dialogCaller.promptDialog({
        caption: t.new_preset_name,
        onYes: resolve,
        onCancel: () => resolve(''),
      });
    });
    if (!name) return;
    if (editingPresets.find((p) => p.name === name || p.key === name)) {
      alertCaller.popUpError({ message: tLaserPanel.existing_name });
      return;
    }
    const newPreset: Preset = {
      ...getDefaultConfig(),
      name: name.trim(),
      isDefault: false,
      module: presetModule,
    };
    if (presetModule === LayerModule.PRINTER) {
      newPreset.halftone = 1;
      newPreset.speed = baseConfig.printingSpeed;
    }
    setEditingPresets([...editingPresets, newPreset]);
    setSelectedPreset(newPreset);
  };

  return (
    <Modal
      open
      centered
      wrapClassName={styles['modal-wrap']}
      title={t.title}
      onCancel={onClose}
      footer={<Footer handleSave={handleSave} handleReset={handleReset} onClose={onClose} />}
    >
      <div className={styles.container}>
        <PresetList
          presets={editingPresets}
          displayList={displayList}
          editingValues={editingValues}
          selected={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          toggleHidePreset={toggleHidePreset}
          onReorder={setEditingPresets}
          ref={listRef}
        />
        <div className={styles.controls}>
          <div>
            <button className={styles.add} type="button" onClick={handleAddPreset}>
              <PlusCircleFilled className={styles.icon} />
              {t.add_new}
            </button>
          </div>
          <div>
            <button type="button" onClick={handleImport} title={t.import}>
              <UploadOutlined className={styles.icon} />
            </button>
            <button type="button" onClick={handleExport} title={t.export}>
              <DownloadOutlined className={styles.icon} />
            </button>
            {hasModule && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: Filter.ALL,
                      label: t.show_all,
                    },
                    {
                      key: Filter.LASER,
                      label: t.laser,
                    },
                    {
                      key: Filter.PRINT,
                      label: t.print,
                    },
                  ],
                  selectable: true,
                  defaultSelectedKeys: [filter],
                  onClick: ({ key }) => setFilter(key as Filter),
                }}
              >
                <ConfigPanelIcons.Filter
                  className={classNames(styles.icon, { [styles.highlight]: filter !== Filter.ALL })}
                />
              </Dropdown>
            )}
          </div>
        </div>
        <div className={styles.detail}>
          <div className={styles.header}>
            <div className={styles.title}>{selectedPreset?.name}</div>
            {!displayPreset.isDefault && (
              <Button danger onClick={handleDelete} data-testid="delete">
                {t.delete}
              </Button>
            )}
            {hasModule && displayPreset.isDefault && (
              <Select value={selectedModule} onChange={setSelectedModule}>
                {availableModules.map((m) => (
                  <Select.Option key={m} value={m}>
                    {moduleTranslations[m]}
                  </Select.Option>
                ))}
              </Select>
            )}
          </div>
          {isPromark ? (
            <PromarkInputs
              preset={displayPreset}
              maxSpeed={workareaObj.maxSpeed}
              minSpeed={workareaObj.minSpeed}
              isInch={isInch}
              lengthUnit={lengthUnit}
              handleChange={handleChange}
            />
          ) : isPrinting ? (
            <PrintingInputs
              preset={displayPreset}
              maxSpeed={workareaObj.maxSpeed}
              minSpeed={workareaObj.minSpeed}
              isInch={isInch}
              lengthUnit={lengthUnit}
              handleChange={handleChange}
            />
          ) : (
            <LaserInputs
              preset={displayPreset}
              maxSpeed={workareaObj.maxSpeed}
              minSpeed={workareaObj.minSpeed}
              isInch={isInch}
              lengthUnit={lengthUnit}
              handleChange={handleChange}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export const showPresetsManagementPanel = ({
  currentModule,
  initPreset,
  onClose,
}: {
  currentModule: LayerModule;
  initPreset?: string;
  onClose?: () => void;
}): void => {
  if (!isIdExist('presets-management-panel')) {
    addDialogComponent(
      'presets-management-panel',
      <PresetsManagementPanel
        currentModule={currentModule}
        initPreset={initPreset}
        onClose={() => {
          popDialogById('presets-management-panel');
          onClose?.();
        }}
      />
    );
  }
};

export default PresetsManagementPanel;
