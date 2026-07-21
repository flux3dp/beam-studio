import { sprintf } from 'sprintf-js';

import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import type { MaintenanceTask, MaterialKey } from '@core/app/constants/maintenance';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import { nextDue } from '@core/helpers/maintenance/dueStatus';
import type { TaskResult } from '@core/helpers/maintenance/records';
import { markTaskDone, setPrimaryMaterial } from '@core/helpers/maintenance/records';
import useI18n from '@core/helpers/useI18n';

import { useMaintenanceData } from './useMaintenanceData';
import { formatShortDate } from './utils';

interface MaintenanceActions {
  markTask: (task: MaintenanceTask, result: TaskResult) => void;
  setMaterial: (material: MaterialKey) => void;
}

/**
 * Side-effectful task actions: persist the result and show the toast feedback. Per-click
 * visual feedback (confetti + status-dot pop) is handled locally by TaskRow.
 */
export const useMaintenanceActions = (): MaintenanceActions => {
  const t = useI18n().maintenance;
  const { material, selection } = useMaintenanceData();

  const markTask = (task: MaintenanceTask, result: TaskResult): void => {
    if (!selection) return;

    // Attribute the action to the logged-in FLUX account when available (PRD R17 "by" note).
    const user = getCurrentUser();
    const by = user?.info?.nickname ?? user?.email;
    const newRecord = markTaskDone(selection.key, selection.model, task.id, result, by, selection.nickname);
    const { name } = t.tasks[task.langKey];

    if (result === 'fail') {
      MessageCaller.openMessage({
        content: sprintf(t.feedback.fail_warning, name),
        duration: 6,
        key: 'maintenance-task',
        level: MessageLevel.WARNING,
      });

      return;
    }

    let content: string;

    if (result === 'pass') {
      content = sprintf(t.feedback.passed, name);
    } else if (result === 'checked') {
      content = sprintf(t.feedback.checked, name);
    } else {
      const due = nextDue(newRecord.tasks[task.id], task, material, newRecord.lastUsedAt);

      content = due ? sprintf(t.feedback.done, name, formatShortDate(due)) : sprintf(t.feedback.done_no_date, name);
    }

    MessageCaller.openMessage({ content, duration: 4, key: 'maintenance-task', level: MessageLevel.SUCCESS });
  };

  const setMaterial = (next: MaterialKey): void => {
    if (!selection) return;

    setPrimaryMaterial(selection.key, selection.model, next, selection.nickname);
  };

  return { markTask, setMaterial };
};
