export interface IChangeLog {
  CHANGES_EN: IChangeLogContent;
  CHANGES_TW: IChangeLogContent;
}

interface IChangeLogContent {
  added: string[];
  changed: string[];
  fixed: string[];
}
