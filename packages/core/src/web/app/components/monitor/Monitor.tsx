import React, { useEffect, useMemo } from 'react';

import { CameraOutlined, FolderOutlined, PictureOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';

import { promarkModels } from '@core/app/actions/beambox/constant';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import deviceConstants from '@core/app/constants/device-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';
import DraggableModal from '@core/app/widgets/DraggableModal';
import localeHelper from '@core/helpers/locale-helper';
import MonitorStatus from '@core/helpers/monitor-status';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import styles from './Monitor.module.scss';
import MonitorCamera from './MonitorCamera';
import MonitorFilelist from './MonitorFilelist';
import MonitorTabExtraContent from './MonitorTabExtraContent';
import MonitorTask from './MonitorTask';

interface Props {
  device: IDeviceInfo;
}

const key = 'monitor.upload.file';

const Monitor = ({ device }: Props): React.JSX.Element => {
  const LANG = useI18n();
  const { currentPath, mode, onClose, report, setMonitorMode, taskImageURL, uploadProgress } =
    React.use(MonitorContext);
  const isPromark = useMemo(() => promarkModels.has(device.model), [device.model]);
  // if Promark, taskMode is always working to prevent FramingTaskManager unmount
  const taskMode = report.st_id === deviceConstants.status.IDLE && !isPromark ? Mode.PREVIEW : Mode.WORKING;
  const monitorMode = [Mode.FILE_PREVIEW, Mode.PREVIEW, Mode.WORKING].includes(mode) ? taskMode : mode;
  const [isUploadCompleted, setIsUploadCompleted] = React.useState(true);

  const tabItems = [
    taskImageURL || isPromark
      ? {
          children: <MonitorTask device={device} />,
          key: taskMode,
          label: (
            <div>
              <PictureOutlined className={styles.icon} />
              {LANG.monitor.taskTab}
            </div>
          ),
        }
      : null,
    isPromark
      ? null
      : {
          children: <MonitorFilelist path={currentPath.join('/')} />,
          key: Mode.FILE,
          label: (
            <div>
              <FolderOutlined className={styles.icon} />
              {LANG.topmenu.file.label}
            </div>
          ),
        },
    // TODO: Fix Promark camera
    localeHelper.isNorthAmerica || isPromark
      ? null
      : {
          children: <MonitorCamera device={device} />,
          key: Mode.CAMERA,
          label: (
            <div>
              <CameraOutlined className={styles.icon} />
              {LANG.monitor.camera}
            </div>
          ),
        },
  ].filter(Boolean) as Array<{ children: React.JSX.Element; key: Mode; label: React.JSX.Element }>;

  useEffect(() => {
    if (uploadProgress) {
      MessageCaller.openMessage({
        content: `${LANG.beambox.popup.progress.uploading}...`,
        key,
        level: MessageLevel.LOADING,
      });
      setIsUploadCompleted(false);
    } else if (report && !isUploadCompleted) {
      MessageCaller.openMessage({
        content: LANG.beambox.popup.successfully_uploaded,
        duration: 2,
        key,
        level: MessageLevel.SUCCESS,
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
      if (report.st_label) {
        return MonitorStatus.getDisplayStatus(report.st_label);
      }

      return MonitorStatus.getDisplayStatus(MonitorStatus.getStLabel(report.st_id));
    }

    return LANG.monitor.connecting;
  }, [LANG, report, uploadProgress]);

  return (
    <DraggableModal footer={null} maskClosable={false} onCancel={onClose} open title={`${device.name} - ${statusText}`}>
      <Tabs
        activeKey={monitorMode}
        items={tabItems}
        onChange={setMonitorMode as any}
        tabBarExtraContent={isPromark ? null : <MonitorTabExtraContent />}
      />
    </DraggableModal>
  );
};

export default Monitor;
