import React, { memo } from 'react';

import { PlusOutlined } from '@ant-design/icons';

import { showAddPresetFromLayer } from '@core/app/components/dialogs/MaterialBrowser/editors';
import { showPresetsManagementPanel } from '@core/app/components/dialogs/PresetsManagementPanel/PresetsManagementPanel';
import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { checkMaterialBrowser } from '@core/helpers/checkFeature';
import useI18n from '@core/helpers/useI18n';

import initState from './initState';
import styles from './ParameterTitle.module.scss';
import SaveConfigButton from './SaveConfigButton';

const ParameterTitle = (): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const tMaterial = useI18n().beambox.material_browser;
  const { configName, module } = useConfigPanelStore();
  const useMaterialBrowserPref = useGlobalPreferenceStore((state) => state['use-material-browser']);
  const useMaterialBrowser = checkMaterialBrowser() && useMaterialBrowserPref;

  const handleOpenManageModal = () => {
    showPresetsManagementPanel({
      currentModule: module.value,
      initPreset: configName.value,
      onClose: initState,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t.parameters}</div>
      <div>
        {useMaterialBrowser ? (
          // New mode: preset management lives in the Material Browser; the save button
          // becomes the "add preset from current layer" flow (R5).
          <button onClick={() => showAddPresetFromLayer()} title={tMaterial.add_from_layer.title} type="button">
            <PlusOutlined />
          </button>
        ) : (
          <>
            <SaveConfigButton />
            <button onClick={handleOpenManageModal} title={t.preset_management.title} type="button">
              <ConfigPanelIcons.Settings />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(ParameterTitle);
