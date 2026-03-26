import type { HistoryActionOptions, IBatchCommand, ICommand } from '@core/interfaces/IHistory';

import undoManager from '../undoManager';

export const handleHistoryActionOptions = (
  cmd: ICommand | null | undefined,
  { addToHistory = true, parentCmd }: HistoryActionOptions = {},
) => {
  if (!cmd) return;

  if ((cmd as IBatchCommand).isEmpty && (cmd as IBatchCommand).isEmpty()) return;

  if (parentCmd) parentCmd.addSubCommand(cmd);
  else if (addToHistory) undoManager.addCommandToHistory(cmd);
};
