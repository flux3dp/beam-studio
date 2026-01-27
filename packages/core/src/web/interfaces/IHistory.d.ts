export interface ICommand {
  apply: (handler) => void;
  doApply: () => void;
  doUnapply: () => void;
  elem: SVGGraphicsElement;
  elements: (predicate?: (subCommand: ICommand) => boolean) => Element[];
  getText: () => string;
  newParent?: Element | Node;
  newValues?: { [key: string]: string };
  oldParent?: Element | Node;
  oldValues?: { [key: string]: string };
  onAfter?: () => void;
  onBefore?: () => void;
  text: string;
  type: () => string;
  unapply: (handler) => void;
}

export interface IBatchCommand extends ICommand {
  addSubCommand: (cmd: ICommand) => void;
  isEmpty: () => boolean;
}

export interface IHistoryHandler {
  handleHistoryEvent: (eventType: string, cmd: ICommand) => void;
  renderText: (elem: SVGTextElement, val: string, showGrips: boolean) => void;
}

export interface IUndoManager {
  addCommandToHistory: (cmd: ICommand) => void;
  beginUndoableChange: (attrName: string, elems: Element[]) => void;
  finishUndoableChange: () => IBatchCommand;
  getNextRedoCommandText: () => string;
  getNextUndoCommandText: () => string;
  getRedoStackSize: () => number;
  getUndoStackSize: () => number;
  redo: () => boolean;
  resetUndoStack: () => void;
  setHandler: (handler: IHistoryHandler) => void;
  undo: () => boolean;
}
