import history from '@core/app/svgedit/history/history';
import type { IBatchCommand } from '@core/interfaces/IHistory';

class HistoryCommandFactory {
  static createBatchCommand(text: string): IBatchCommand {
    return new history.BatchCommand(text);
  }
}

export default HistoryCommandFactory;
