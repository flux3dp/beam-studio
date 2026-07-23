import React, { use, useMemo } from 'react';

import { Badge } from 'antd';

import { showMaintenanceChecklist } from '@core/app/components/dialogs/MaintenanceChecklist/showMaintenanceChecklist';
import { getScheduleForModel } from '@core/app/constants/maintenance';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useStorageStore } from '@core/app/stores/storageStore';
import { essentialCounts } from '@core/helpers/maintenance/essentialCounts';
import { getPrimaryMaterial, machineKeyOf } from '@core/helpers/maintenance/records';
import useI18n from '@core/helpers/useI18n';

import styles from './MaintenanceButton.module.scss';

/**
 * Opens the Maintenance Checklist for the connected machine, with a red dot when that machine has an
 * overdue essential task (PRD R4). The badge is the only proactive surface in Phase 1 — there is no
 * startup reminder (D8) — so it stays scoped to the selected device rather than every known machine.
 */
const MaintenanceButton = (): React.JSX.Element => {
  const lang = useI18n().topbar.menu;
  const { selectedDevice } = use(CanvasContext);
  const records = useStorageStore((state) => state['maintenance-records']);

  const hasOverdueEssential = useMemo(() => {
    if (!selectedDevice) return false;

    const schedule = getScheduleForModel(selectedDevice.model);

    // Models without a published schedule have nothing to be overdue on.
    if (!schedule) return false;

    const record = records?.[machineKeyOf(selectedDevice)];

    return essentialCounts(schedule, record, getPrimaryMaterial(record)).overdue > 0;
  }, [records, selectedDevice]);

  // Without a device the dialog falls back to its own default machine (PRD R3), same as the Help menu.
  const handleClick = (): void => showMaintenanceChecklist(selectedDevice ? machineKeyOf(selectedDevice) : undefined);

  return (
    <div className={styles.button} onClick={handleClick} title={lang.maintenance_checklist}>
      <Badge className={styles.badge} dot={hasOverdueEssential} offset={[-2, 2]} size="default">
        <TopBarIcons.Maintenance className={styles.icon} />
      </Badge>
    </div>
  );
};

export default MaintenanceButton;
