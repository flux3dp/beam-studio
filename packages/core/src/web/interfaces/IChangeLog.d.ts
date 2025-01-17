export interface IChangeLog {
  CHANGES_TW: IChangeLogContent;
  CHANGES_EN: IChangeLogContent;
}

interface IChangeLogContent {
  added: string[];
  fixed: string[];
  changed: string[];
}
