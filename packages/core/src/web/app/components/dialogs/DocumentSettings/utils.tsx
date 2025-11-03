import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

import { ModuleSettings4C } from './ModuleSettings4C';
import { PassthroughSettings } from './PassthroughSettings';

export const showPassthroughSettings = ({
  isManualMode,
  onSave,
  workarea,
}: {
  isManualMode?: boolean;
  onSave?: () => void;
  workarea?: WorkAreaModel;
}) => {
  if (isIdExist('passthrough-settings')) return;

  addDialogComponent(
    'passthrough-settings',
    <PassthroughSettings
      isManualMode={isManualMode}
      onClose={() => popDialogById('passthrough-settings')}
      onSave={onSave}
      workarea={workarea}
    />,
  );
};

export const showModuleSettings4C = () => {
  if (isIdExist('module-settings-4c')) return;

  addDialogComponent('module-settings-4c', <ModuleSettings4C onClose={() => popDialogById('module-settings-4c')} />);
};
