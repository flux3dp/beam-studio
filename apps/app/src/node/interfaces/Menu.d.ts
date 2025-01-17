// eslint-disable-next-line import/no-extraneous-dependencies
import { MenuItem } from 'electron';

export interface MenuData extends MenuItem {
  id: string;
  uuid?: string;
  serial?: string;
  machineName?: string;
  source?: string;
}
