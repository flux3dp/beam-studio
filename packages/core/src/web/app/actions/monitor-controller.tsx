import * as React from 'react';
import Dialog from '@core/app/actions/dialog-caller';
import Monitor from '@core/app/views/monitor/Monitor';
import { IDeviceInfo } from '@core/interfaces/IDevice';
import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContextProvider } from '@core/app/contexts/MonitorContext';

const monitorController = {
  showMonitor: (
    device: IDeviceInfo,
    mode: Mode = Mode.FILE,
    previewTask?: { fcodeBlob: Blob; taskImageURL: string; taskTime: number; fileName: string },
    autoStart?: boolean,
  ): void => {
    Dialog.addDialogComponent(
      'monitor',
      <MonitorContextProvider
        device={device}
        mode={mode}
        previewTask={previewTask}
        autoStart={autoStart}
        onClose={() => Dialog.popDialogById('monitor')}
      >
        <Monitor device={device} />
      </MonitorContextProvider>,
    );
  },
};

export default monitorController;
