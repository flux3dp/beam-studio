import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DownloadOutlined, PlusCircleFilled, UploadOutlined } from '@ant-design/icons';
import { Button, Dropdown, Modal } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import { promarkModels } from '@core/app/actions/beambox/constant';
import dialogCaller from '@core/app/actions/dialog-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import alertConstants from '@core/app/constants/alert-constants';
import LayerModule, { modelsWithModules, printingModules } from '@core/app/constants/layer-module/layer-modules';
import presets from '@core/app/constants/presets';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import Select from '@core/app/widgets/AntdSelect';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { baseConfig, getDefaultConfig, postPresetChange } from '@core/helpers/layer/layer-config-helper';
import layerModuleHelper from '@core/helpers/layer-module/layer-module-helper';
import presetHelper from '@core/helpers/presets/preset-helper';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';
import type { ConfigKey, ConfigKeyTypeMap, Preset } from '@core/interfaces/ILayerConfig';

import Footer from './Footer';
import LaserInputs from './LaserInputs';
import PresetList from './PresetList';
import styles from './PresetsManagementPanel.module.scss';
import PrintingInputs from './PrintingInputs';
import PromarkInputs from './PromarkInputs';

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

const PresetsManagementPanel = ({ currentModule, initPreset, onClose }: Props): React.JSX.Element => {
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
          if (filter === Filter.ALL) {
            return true;
          }

          return printingModules.has(c.module ?? 0) ? filter === Filter.PRINT : filter === Filter.LASER;
        }

        const hasPreset = presetHelper.modelHasPreset(workarea, c.key);

        if (!hasPreset) {
          return false;
        }

        if (filter === Filter.ALL || !hasModule) {
          return true;
        }

        const isPrintingPreset = Boolean(presetHelper.getDefaultPreset(c.key, workarea, LayerModule.PRINTER));

        return isPrintingPreset ? filter === Filter.PRINT : filter === Filter.LASER;
      }),
    [workarea, hasModule, editingPresets, filter],
  );
  const [selectedPreset, setSelectedPreset] = useState<null | Preset>(
    initPreset
      ? (displayList.find((p) => initPreset === p.name || initPreset === p.key) ?? displayList[0])
      : displayList[0],
  );

  useEffect(() => {
    if (!selectedPreset || !listRef.current) {
      return;
    }

    const { isDefault, key, name } = selectedPreset;
    const item = listRef.current.querySelector(`[data-key="${isDefault ? key : name}"]`);

    if (!item) {
      return;
    }

    const { clientHeight: listHeight, offsetTop, scrollTop } = listRef.current;
    const { clientHeight: itemHeight, offsetTop: itemTop } = item as HTMLElement;
    const listTop = offsetTop + scrollTop;
    const itemBottom = itemTop + itemHeight;
    const listBottom = listTop + listHeight;

    if (itemBottom < listTop || itemTop > listBottom) {
      item?.scrollIntoView({ behavior: 'auto' });
    }
  }, [selectedPreset]);

  const availableModules = useMemo(() => {
    if (selectedPreset?.isDefault && hasModule) {
      return Object.keys(presets[selectedPreset.key]?.[workarea] || {}).map((m) => Number.parseInt(m, 10));
    }

    return [];
  }, [workarea, hasModule, selectedPreset]);
  const [selectedModule, setSelectedModule] = useState(currentModule);

  useEffect(() => {
    if (availableModules.length > 0) {
      setSelectedModule((cur) => {
        if (availableModules.includes(cur)) {
          return cur;
        }

        return availableModules[0];
      });
    } else if (selectedPreset?.module) {
      setSelectedModule(selectedPreset.module);
    }
  }, [availableModules, selectedPreset]);

  const displayPreset = useMemo(() => {
    if (!selectedPreset) {
      return { isDefault: true, name: '' };
    }

    if (!selectedPreset.isDefault) {
      return { ...selectedPreset, ...editingValues[selectedPreset.name] };
    }

    const presetModel = presetHelper.getPresetModel(workarea);
    const keyPresets = presets[selectedPreset.key]?.[presetModel];

    if (!keyPresets) {
      return selectedPreset;
    }

    if (keyPresets[selectedModule]) {
      return { ...selectedPreset, ...keyPresets[selectedModule] };
    }

    return { ...selectedPreset, ...Object.values(keyPresets)[0] };
  }, [workarea, selectedPreset, selectedModule, editingValues]);

  const handleChange = <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T]) => {
    const { isDefault, name } = selectedPreset;

    if (isDefault) {
      return;
    }

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
    preset.hide = !preset.hide;
    setEditingPresets([...editingPresets]);
  };
  const isPrinting = useMemo(() => displayPreset.module === LayerModule.PRINTER, [displayPreset]);

  const handleDelete = () => {
    if (selectedPreset.isDefault) {
      return;
    }

    const displayIdx = displayList.findIndex((p) => p === selectedPreset);
    const newPresets = editingPresets.filter((p) => p !== selectedPreset);

    setSelectedPreset(displayList[displayIdx === 0 ? 1 : displayIdx - 1]);
    setEditingPresets(newPresets);
  };

  const getCurrentPresets = useCallback(() => {
    const res = [...editingPresets];

    for (let i = 0; i < res.length; i += 1) {
      const { isDefault, name } = editingPresets[i];

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
      buttonType: alertConstants.CONFIRM_CANCEL,
      message: t.sure_to_reset,
      onConfirm: () => {
        presetHelper.resetPresetList();
        postPresetChange();
        onClose();
      },
      type: alertConstants.WARNING,
    });
  }, [t, onClose]);

  const handleAddPreset = async () => {
    let presetModule = LayerModule.LASER_UNIVERSAL;

    if (hasModule) {
      presetModule = await dialogCaller.showRadioSelectDialog({
        id: 'import-module',
        options: [
          { label: t.laser, value: LayerModule.LASER_UNIVERSAL },
          { label: t.print, value: LayerModule.PRINTER },
        ],
        title: lang.beambox.popup.select_import_module,
      });

      if (!presetModule) {
        return;
      }
    }

    const name = await new Promise<string>((resolve) => {
      dialogCaller.promptDialog({
        caption: t.new_preset_name,
        onCancel: () => resolve(''),
        onYes: resolve,
      });
    });

    if (!name) {
      return;
    }

    if (editingPresets.find((p) => p.name === name || p.key === name)) {
      alertCaller.popUpError({ message: tLaserPanel.existing_name });

      return;
    }

    const newPreset: Preset = {
      ...getDefaultConfig(),
      isDefault: false,
      module: presetModule,
      name: name.trim(),
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
      centered
      footer={<Footer handleReset={handleReset} handleSave={handleSave} onClose={onClose} />}
      onCancel={onClose}
      open
      title={t.title}
      wrapClassName={styles['modal-wrap']}
    >
      <div className={styles.container}>
        <PresetList
          displayList={displayList}
          editingValues={editingValues}
          onReorder={setEditingPresets}
          presets={editingPresets}
          ref={listRef}
          selected={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          toggleHidePreset={toggleHidePreset}
        />
        <div className={styles.controls}>
          <div>
            <button className={styles.add} onClick={handleAddPreset} type="button">
              <PlusCircleFilled className={styles.icon} />
              {t.add_new}
            </button>
          </div>
          <div>
            <button onClick={handleImport} title={t.import} type="button">
              <UploadOutlined className={styles.icon} />
            </button>
            <button onClick={handleExport} title={t.export} type="button">
              <DownloadOutlined className={styles.icon} />
            </button>
            {hasModule && (
              <Dropdown
                menu={{
                  defaultSelectedKeys: [filter],
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
                  onClick: ({ key }) => setFilter(key as Filter),
                  selectable: true,
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
              <Button danger data-testid="delete" onClick={handleDelete}>
                {t.delete}
              </Button>
            )}
            {hasModule && displayPreset.isDefault && (
              <Select onChange={setSelectedModule} value={selectedModule}>
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
              handleChange={handleChange}
              isInch={isInch}
              lengthUnit={lengthUnit}
              maxSpeed={workareaObj.maxSpeed}
              minSpeed={workareaObj.minSpeed}
              preset={displayPreset}
            />
          ) : isPrinting ? (
            <PrintingInputs
              handleChange={handleChange}
              isInch={isInch}
              lengthUnit={lengthUnit}
              maxSpeed={workareaObj.maxSpeed}
              minSpeed={workareaObj.minSpeed}
              preset={displayPreset}
            />
          ) : (
            <LaserInputs
              handleChange={handleChange}
              isInch={isInch}
              lengthUnit={lengthUnit}
              maxSpeed={workareaObj.maxSpeed}
              minSpeed={workareaObj.minSpeed}
              preset={displayPreset}
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
      />,
    );
  }
};

export default PresetsManagementPanel;
