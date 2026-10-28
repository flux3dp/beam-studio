import React, { useMemo } from 'react';

import { Tabs } from 'antd';

import {
  fisheyeModels,
  legacyBeamSeriesModels,
  modelsWithModules,
  promarkModels,
} from '@core/app/actions/beambox/constant';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export interface ManualConfigurationProps {
  device: IDeviceInfo;
  onClose: () => void;
}

/** Which tabs a model gets; see docs/prd/manual-calibration-config.md §5 */
const getManualConfigurationTabs = (model: string) => ({
  camera: fisheyeModels.has(model) || model === 'fbm2' || promarkModels.has(model) || legacyBeamSeriesModels.has(model),
  modules: modelsWithModules.has(model),
  printAndCut: true,
});

const ManualConfiguration = ({ device, onClose }: ManualConfigurationProps): React.JSX.Element => {
  const t = useI18n().manual_config;
  const tabs = useMemo(() => getManualConfigurationTabs(device.model), [device.model]);

  // each tab owns its own loading and Save; the modal only hosts them
  const items = [
    ...(tabs.camera ? [{ children: null, key: 'camera', label: t.tab_camera }] : []),
    ...(tabs.modules ? [{ children: null, key: 'modules', label: t.tab_modules }] : []),
    ...(tabs.printAndCut ? [{ children: null, key: 'printAndCut', label: t.tab_print_and_cut }] : []),
  ];

  return (
    <DraggableModal footer={null} onCancel={onClose} open title={t.title} width={520}>
      <Tabs items={items} />
    </DraggableModal>
  );
};

export default ManualConfiguration;
