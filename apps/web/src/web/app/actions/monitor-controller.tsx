import * as React from 'react';
import Dialog from 'app/actions/dialog-caller';
import Monitor from 'app/views/monitor/Monitor';
import { IDeviceInfo } from 'interfaces/IDevice';
import { Mode } from 'app/constants/monitor-constants';
import { MonitorContextProvider } from 'app/contexts/MonitorContext';

const monitorController = {
  showMonitor: (
    device: IDeviceInfo,
    mode: Mode = Mode.FILE,
    previewTask?: { fcodeBlob: Blob; taskImageURL: string; taskTime: number; fileName: string },
    autoStart?: boolean
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
      </MonitorContextProvider>
    );
  },
};

export default monitorController;
