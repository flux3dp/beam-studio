import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import type { Selection } from './utils';

const initialState = {
  historyOpen: false,
  /** The machine to open on, from the `showMaintenanceChecklist` caller. Read once, at mount, by `MachineSelect`. */
  initialMachineKey: undefined as string | undefined,
  /** The resolved machine, published by `MachineSelect` (which owns the roster and the key). */
  selection: undefined as Selection | undefined,
};

/**
 * The two facts that have to cross the dialog's portal boundaries: `Footer` renders inside the antd
 * Modal while `Celebration`/`HistoryModal` are siblings of it. Everything else stays local —
 * derived data in `useMaintenanceData`, side effects in `useMaintenanceActions`, the per-row
 * status-dot "pop" in `TaskRow`, and the machine roster in `MachineSelect`.
 */
export const useMaintenanceStore = create(
  combine(initialState, (set) => ({
    closeHistory: () => set({ historyOpen: false }),
    openHistory: () => set({ historyOpen: true }),
    /**
     * Applies one dialog-open's parameters. The store outlives the dialog, so every field here is
     * stale by the next open. Called by `showMaintenanceChecklist` *before* mounting, so the first
     * render already sees them — no post-mount correction, no flash.
     */
    reset: (initialMachineKey?: string) => set({ historyOpen: false, initialMachineKey, selection: undefined }),
    setSelection: (selection: Selection | undefined) => set({ selection }),
  })),
);
