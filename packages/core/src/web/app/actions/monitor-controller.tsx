import * as React from 'react';

import Dialog from '@core/app/actions/dialog-caller';
import Monitor from '@core/app/components/monitor/Monitor';
import { Mode } from '@core/app/constants/monitor-constants';
import type { PreviewTask, VariableTextTask } from '@core/app/contexts/MonitorContext';
import { MonitorContextProvider } from '@core/app/contexts/MonitorContext';
import { checkBlockedSerial } from '@core/helpers/device/checkBlockedSerial';
import type { VariableTextElemHandler } from '@core/helpers/variableText';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const monitorController = {
  showMonitor: async (
    device: IDeviceInfo,
    mode: Mode = Mode.FILE,
    previewTask?: PreviewTask,
    autoStart?: boolean,
    vtTaskTinfo?: VariableTextTask,
    vtElemHandler?: VariableTextElemHandler,
  ): Promise<void> => {
    const res = await checkBlockedSerial(device.serial);

    if (!res) {
      return;
    }

    Dialog.addDialogComponent(
      'monitor',
      <MonitorContextProvider
        autoStart={autoStart}
        device={device}
        mode={mode}
        onClose={() => Dialog.popDialogById('monitor')}
        previewTask={previewTask}
        vtElemHandler={vtElemHandler}
        vtTaskTinfo={vtTaskTinfo}
      >
        <Monitor device={device} />
      </MonitorContextProvider>,
    );
  },
};

export default monitorController;
