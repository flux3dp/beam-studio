import React from 'react';

import { Button, Empty, Modal } from 'antd';
import dayjs from 'dayjs';
import { sprintf } from 'sprintf-js';

import { HISTORY_CAP } from '@core/helpers/maintenance/records';
import useI18n from '@core/helpers/useI18n';

import { useMaintenanceData } from '../useMaintenanceData';
import { useMaintenanceStore } from '../useMaintenanceStore';
import { getTaskStrings } from '../utils';

import styles from './HistoryModal.module.scss';

/** Per-task action history for the selected machine. */
const HistoryModal = (): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.maintenance;
  const { record, schedule } = useMaintenanceData();
  const open = useMaintenanceStore((state) => state.historyOpen);
  const closeHistory = useMaintenanceStore((state) => state.closeHistory);
  const hasHistory = Boolean(
    schedule && record && schedule.tasks.some((task) => record.tasks[task.id]?.history?.length),
  );

  return (
    <Modal
      footer={<Button onClick={closeHistory}>{lang.global.ok}</Button>}
      onCancel={closeHistory}
      open={open}
      title={t.actions.history}
    >
      <div className={styles.history}>
        {schedule && record ? (
          schedule.tasks
            .filter((task) => record.tasks[task.id]?.history?.length)
            .map((task) => (
              <div className={styles.historyItem} key={task.id}>
                <div className={styles.historyName}>{getTaskStrings(t, task).name}</div>
                {record.tasks[task.id]?.history?.map((entry, index) => (
                  <div className={styles.historyEntry} key={index}>
                    {dayjs(entry.at).format('YYYY-MM-DD HH:mm')} · {entry.result}
                    {entry.by ? ` · ${entry.by}` : ''}
                  </div>
                ))}
              </div>
            ))
        ) : (
          <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
      {hasHistory && <div className={styles.hint}>{sprintf(t.history_hint, HISTORY_CAP)}</div>}
    </Modal>
  );
};

export default HistoryModal;
