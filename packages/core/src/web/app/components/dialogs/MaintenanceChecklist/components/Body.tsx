import React, { Fragment, useMemo } from 'react';

import type { MaintenanceArea, MaintenanceTask } from '@core/app/constants/maintenance';
import type { MaintenanceStatus } from '@core/helpers/maintenance/dueStatus';
import { statusOf } from '@core/helpers/maintenance/dueStatus';
import useI18n from '@core/helpers/useI18n';

import { useMaintenanceData } from '../useMaintenanceData';

import styles from './Body.module.scss';
import TaskRow from './TaskRow';

interface TaskWithStatus {
  status: MaintenanceStatus;
  task: MaintenanceTask;
}

/** Task list grouped by area, with essential-overdue tasks floated to the top of each area. */
const Body = (): React.JSX.Element => {
  const t = useI18n().maintenance;
  const { material, record, schedule, selection } = useMaintenanceData();

  const areas = useMemo(() => {
    if (!schedule) return [];

    const tasksByArea = new Map<MaintenanceArea, TaskWithStatus[]>();

    schedule.tasks.forEach((task) => {
      const entry: TaskWithStatus = {
        status: statusOf(record?.tasks[task.id], task, material, record?.lastUsedAt),
        task,
      };
      const areaTasks = tasksByArea.get(task.area);

      if (areaTasks) areaTasks.push(entry);
      else tasksByArea.set(task.area, [entry]);
    });

    // Essential-overdue tasks sort to the top of their area (PRD R9).
    const priority = ({ status, task }: TaskWithStatus): number => (task.essential && status === 'overdue' ? 0 : 1);

    return schedule.areaOrder.flatMap((area) => {
      const tasks = tasksByArea.get(area);

      // Sorted in place: the array is ours, built just above.
      return tasks ? [{ area, tasks: tasks.sort((taskA, taskB) => priority(taskA) - priority(taskB)) }] : [];
    });
  }, [material, record, schedule]);

  if (!selection) {
    return <div className={styles.empty}>{t.empty_no_machine}</div>;
  }

  if (!schedule) {
    return <div className={styles.empty}>{t.empty_no_schedule}</div>;
  }

  return (
    <div className={styles.body}>
      {areas.map(({ area, tasks }) => (
        <Fragment key={area}>
          <div className={styles.area}>{t.areas[area]}</div>
          {tasks.map(({ status, task }) => (
            <TaskRow
              key={task.id}
              lastUsedAt={record?.lastUsedAt}
              material={material}
              record={record?.tasks[task.id]}
              status={status}
              task={task}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
};

export default Body;
