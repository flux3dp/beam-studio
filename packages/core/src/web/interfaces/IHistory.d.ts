export interface ICommand {
  elem: SVGGraphicsElement;
  text: string;
  type: () => string;
  getText: () => string;
  elements: () => Element[];
  doApply: () => void;
  apply: (handler) => void;
  doUnapply: () => void;
  unapply: (handler) => void;
  newParent?: Node | Element;
  oldParent?: Node | Element;
  newValues?: { [key: string]: string };
  oldValues?: { [key: string]: string };
  onBefore: () => void | null;
  onAfter: () => void | null;
}

export interface IBatchCommand extends ICommand {
  addSubCommand: (cmd: ICommand) => void;
  isEmpty: () => boolean;
}

export interface IHistoryHandler {
  renderText: (elem: SVGTextElement, val: string, showGrips: boolean) => void;
  handleHistoryEvent: (eventType: string, cmd: ICommand) => void;
}

export interface IUndoManager {
  setHandler: (handler: IHistoryHandler) => void;
  resetUndoStack: () => void;
  getUndoStackSize: () => number;
  getRedoStackSize: () => number;
  getNextUndoCommandText: () => string;
  getNextRedoCommandText: () => string;
  undo: () => boolean;
  redo: () => boolean;
  addCommandToHistory: (cmd: ICommand) => void;
  beginUndoableChange: (attrName: string, elems: Element[]) => void;
  finishUndoableChange: () => IBatchCommand;
}
