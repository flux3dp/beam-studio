import { ICommand } from 'interfaces/IHistory';

import { BaseHistoryCommand } from './history';


class CustomCommand extends BaseHistoryCommand implements ICommand {
  _doApply: () => void;

  _doUnapply: () => void;

  elements = (): Element[] => [];

  type = (): string => 'CustomCommand';

  constructor(text: string, doApply: () => void, doUnapply: () => void) {
    super();
    this.text = text;
    this._doApply = doApply;
    this._doUnapply = doUnapply;
  }

  doApply = (): void => {
    try {
      this._doApply();
    } catch (e) {
      console.error('Failed to apply command', this.text, e);
    }
  };

  doUnapply = (): void => {
    try {
      this._doUnapply();
    } catch (e) {
      console.error('Failed to unapply command', this.text, e);
    }
  };
}

export default CustomCommand;
