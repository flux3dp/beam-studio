import history from 'app/svgedit/history/history';
import { IBatchCommand } from 'interfaces/IHistory';

class HistoryCommandFactory {
  static createBatchCommand(text: string): IBatchCommand {
    return new history.BatchCommand(text);
  }
}

export default HistoryCommandFactory;
