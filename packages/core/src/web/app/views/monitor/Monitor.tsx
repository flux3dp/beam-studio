import React, { useEffect, useMemo } from 'react';
import { Modal, Tabs } from 'antd';
import { CameraOutlined, FolderOutlined, PictureOutlined } from '@ant-design/icons';

import deviceConstants from 'app/constants/device-constants';
import localeHelper from 'helpers/locale-helper';
import MonitorStatus from 'helpers/monitor-status';
import useI18n from 'helpers/useI18n';
import { Mode } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/MonitorContext';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import { IDeviceInfo } from 'interfaces/IDevice';
import { promarkModels } from 'app/actions/beambox/constant';

import MonitorCamera from './MonitorCamera';
import MonitorFilelist from './MonitorFilelist';
import MonitorTabExtraContent from './MonitorTabExtraContent';
import MonitorTask from './MonitorTask';

interface Props {
  device: IDeviceInfo;
}

const key = 'monitor.upload.file';

const Monitor = ({ device }: Props): JSX.Element => {
  const LANG = useI18n();
  const { currentPath, mode, onClose, report, setMonitorMode, taskImageURL, uploadProgress } =
    React.useContext(MonitorContext);
  const isPromark = useMemo(() => promarkModels.has(device.model), [device.model]);
  // if Promark, taskMode is always working to prevent FramingTaskManager unmount
  const taskMode =
    report.st_id === deviceConstants.status.IDLE && !isPromark ? Mode.PREVIEW : Mode.WORKING;
  const monitorMode = [Mode.PREVIEW, Mode.FILE_PREVIEW, Mode.WORKING].includes(mode)
    ? taskMode
    : mode;
  const [isUploadCompleted, setIsUploadCompleted] = React.useState(true);

  const tabItems = [
    taskImageURL || promarkModels.has(device.model)
      ? {
          label: (
            <div>
              <PictureOutlined />
              {LANG.monitor.taskTab}
            </div>
          ),
          key: taskMode,
          children: <MonitorTask device={device} />,
        }
      : null,
    {
      label: (
        <div>
          <FolderOutlined />
          {LANG.topmenu.file.label}
        </div>
      ),
      key: Mode.FILE,
      children: <MonitorFilelist path={currentPath.join('/')} />,
    },
    localeHelper.isNorthAmerica
      ? null
      : {
          label: (
            <div>
              <CameraOutlined />
              {LANG.monitor.camera}
            </div>
          ),
          key: Mode.CAMERA,
          children: <MonitorCamera device={device} />,
        },
  ].filter(Boolean);

  useEffect(() => {
    if (uploadProgress) {
      MessageCaller.openMessage({
        key,
        level: MessageLevel.LOADING,
        content: `${LANG.beambox.popup.progress.uploading}...`,
      });
      setIsUploadCompleted(false);
    } else if (report && !isUploadCompleted) {
      MessageCaller.openMessage({
        key,
        level: MessageLevel.SUCCESS,
        content: LANG.beambox.popup.successfully_uploaded,
        duration: 2,
        onClose: () => {
          setIsUploadCompleted(true);
        },
      });
    }
  }, [LANG, isUploadCompleted, report, uploadProgress]);

  const statusText = useMemo(() => {
    if (uploadProgress) {
      return LANG.beambox.popup.progress.uploading;
    }

    if (report) {
      if (report.st_label) return MonitorStatus.getDisplayStatus(report.st_label);
      return MonitorStatus.getDisplayStatus(MonitorStatus.getStLabel(report.st_id));
    }

    return LANG.monitor.connecting;
  }, [LANG, report, uploadProgress]);

  return (
    <Modal open centered onCancel={onClose} title={`${device.name} - ${statusText}`} footer={null}>
      <Tabs
        activeKey={monitorMode}
        items={tabItems}
        onChange={setMonitorMode}
        tabBarExtraContent={<MonitorTabExtraContent />}
      />
    </Modal>
  );
};

export default Monitor;
