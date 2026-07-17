import type { ReactNode } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import { CheckOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Select, Space, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';

import type { MaintenanceTask, MaterialKey } from '@core/app/constants/maintenance';
import { popConfetti } from '@core/helpers/confetti';
import type { MaintenanceStatus } from '@core/helpers/maintenance/dueStatus';
import { formatCadence, nextDue } from '@core/helpers/maintenance/dueStatus';
import type { TaskRecord, TaskResult } from '@core/helpers/maintenance/records';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import { useMaintenanceActions } from '../useMaintenanceActions';
import { formatShortDate } from '../utils/formatShortDate';

import styles from './TaskRow.module.scss';

/** Status dot color modifiers (paired with `.dot`). */
const DOT_CLASS: Record<MaintenanceStatus, string> = {
  duesoon: styles.dueSoon,
  never: styles.never,
  ok: styles.upToDate,
  overdue: styles.overdue,
};

/** How long the status dot stays in its "pop" animation after a successful mark. */
const POP_MS = 600;

interface Props {
  lastUsedAt?: string;
  material: MaterialKey;
  record: TaskRecord | undefined;
  status: MaintenanceStatus;
  task: MaintenanceTask;
}

const TaskRow = ({ lastUsedAt, material, record, status, task }: Props): ReactNode => {
  const t = useI18n().maintenance;
  const { markTask, setMaterial } = useMaintenanceActions();
  const { keyPoints, name } = t.tasks[task.langKey];
  const { cadence } = task;
  const [popped, setPopped] = useState(false);
  const popTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(popTimer.current), []);

  // Marks the task, then plays this row's local success feedback (confetti + dot pop).
  const handleMark = (result: TaskResult, event: React.MouseEvent): void => {
    markTask(task, result);

    if (result === 'fail') return;

    popConfetti(event.clientX, event.clientY);
    setPopped(true);
    clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPopped(false), POP_MS);
  };

  const tooltip = (
    <div>
      <div>{keyPoints}</div>
      {task.helpUrl && (
        <a className={styles.guideLink} onClick={() => browser.open(task.helpUrl!)}>
          {t.actions.open_guide}
        </a>
      )}
    </div>
  );

  const cadenceNode =
    cadence.kind === 'time_by_material' ? (
      <Select
        className={styles.materialSelect}
        onChange={setMaterial}
        options={[
          { label: t.materials.wood, value: 'wood' },
          { label: t.materials.acrylic, value: 'acrylic' },
          { label: t.materials.leather, value: 'leather' },
          { label: t.materials.paper, value: 'paper' },
        ]}
        size="small"
        value={material}
      />
    ) : (
      <span>{formatCadence(cadence, t.cadence)}</span>
    );

  const lastText = record?.lastDoneAt
    ? `${t.status.last} ${formatShortDate(dayjs(record.lastDoneAt))}`
    : t.status.not_logged;

  const nextDueText = (): string => {
    const due = nextDue(record, task, material, lastUsedAt);

    return due ? formatShortDate(due) : '';
  };

  let dueNode: React.JSX.Element;

  if (task.actionType === 'passfail') {
    const colorClass =
      record?.lastResult === 'pass' ? styles.ok : record?.lastResult === 'fail' ? styles.overdue : styles.muted;
    const text = record?.lastResult
      ? record.lastResult === 'pass'
        ? t.status.healthy
        : t.status.replace_tube
      : t.status.not_checked;

    dueNode = <span className={classNames(styles.due, colorClass)}>{text}</span>;
  } else if (cadence.kind === 'condition') {
    const checked = Boolean(record?.lastDoneAt || record?.lastResult);

    dueNode = (
      <span className={classNames(styles.due, checked ? styles.ok : styles.muted)}>
        {checked ? t.status.checked : t.status.not_checked}
      </span>
    );
  } else if (status === 'overdue') {
    dueNode = <span className={classNames(styles.due, styles.overdue)}>{t.status.overdue}</span>;
  } else if (status === 'never') {
    dueNode = <span className={classNames(styles.due, styles.never)}>{t.status.never_done}</span>;
  } else {
    dueNode = (
      <span className={classNames(styles.due, status === 'duesoon' ? styles.dueSoon : styles.ok)}>
        {`${status === 'duesoon' ? t.status.due : t.status.next} ${nextDueText()}`}
      </span>
    );
  }

  const action =
    task.actionType === 'passfail' ? (
      <Space size={8}>
        <Button ghost onClick={(e) => handleMark('pass', e)} type="primary">
          {t.actions.pass}
        </Button>
        <Button danger onClick={(e) => handleMark('fail', e)}>
          {t.actions.fail}
        </Button>
      </Space>
    ) : (
      <Button
        icon={<CheckOutlined />}
        onClick={(e) => handleMark(task.actionType === 'check' ? 'checked' : 'done', e)}
        type={status === 'overdue' ? 'primary' : 'default'}
      >
        {task.actionType === 'check' ? t.actions.mark_checked : t.actions.mark_done}
      </Button>
    );

  return (
    <div className={styles.row}>
      <span className={classNames(styles.dot, DOT_CLASS[status], { [styles.pop]: popped })} />
      <div className={styles.info}>
        <div className={styles.name}>
          <span>{name}</span>
          {task.essential && <span className={styles.ess}>{t.essential}</span>}
          <Tooltip title={tooltip}>
            <InfoCircleOutlined className={styles.infoIcon} />
          </Tooltip>
        </div>
        <div className={styles.meta}>
          {cadenceNode}
          <span className={styles.sep}>·</span>
          <span>{lastText}</span>
          <span className={styles.sep}>·</span>
          {dueNode}
        </div>
      </div>
      <div className={styles.act}>{action}</div>
    </div>
  );
};

export default TaskRow;
