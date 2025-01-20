import type { MenuItem } from 'electron';

export interface MenuData extends MenuItem {
  id: string;
  machineName?: string;
  serial?: string;
  source?: string;
  uuid?: string;
}
