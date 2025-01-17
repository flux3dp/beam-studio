import currentFileManager from 'app/svgedit/currentFileManager';
import { IBatchCommand, IHistoryHandler, IUndoManager } from 'interfaces/IHistory';

import history, { BaseHistoryCommand } from './history';

export class UndoManager implements IUndoManager {
  private handler: IHistoryHandler;

  private undoStackPointer: number;

  private undoStack: BaseHistoryCommand[];

  private undoChangeStackPointer: number;

  private undoableChangeStack: {
    attrName: string;
    elements: Element[];
    oldValues: string[];
  }[];

  constructor(historyEventHandler: IHistoryHandler) {
    this.handler = historyEventHandler || null;
    this.undoStackPointer = 0;
    this.undoStack = [];

    // this is the stack that stores the original values, the elements and
    // the attribute name for begin/finish
    this.undoChangeStackPointer = -1;
    this.undoableChangeStack = [];
  }

  setHandler(historyEventHandler: IHistoryHandler): void {
    this.handler = historyEventHandler;
  }

  resetUndoStack(): void {
    this.undoStack = [];
    this.undoStackPointer = 0;
  }

  getUndoStackSize(): number {
    return this.undoStackPointer;
  }

  getRedoStackSize(): number {
    return this.undoStack.length - this.undoStackPointer;
  }

  getNextUndoCommandText(): string {
    return this.undoStackPointer > 0 ? this.undoStack[this.undoStackPointer - 1].getText() : '';
  }

  getNextRedoCommandText(): string {
    return this.undoStackPointer < this.undoStack.length
      ? this.undoStack[this.undoStackPointer].getText()
      : '';
  }

  undo(): boolean {
    if (this.undoStackPointer > 0) {
      this.undoStackPointer -= 1;
      const cmd = this.undoStack[this.undoStackPointer];
      cmd.unapply(this.handler);
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.undoStackPointer < this.undoStack.length && this.undoStack.length > 0) {
      const cmd = this.undoStack[this.undoStackPointer];
      this.undoStackPointer += 1;
      cmd.apply(this.handler);
      return true;
    }
    return false;
  }

  addCommandToHistory(cmd: BaseHistoryCommand): void {
    // FIXME: we MUST compress consecutive text changes to the same element
    // (right now each keystroke is saved as a separate command that includes the
    // entire text contents of the text element)
    // TODO: consider limiting the history that we store here (need to do some slicing)

    // if our stack pointer is not at the end, then we have to remove
    // all commands after the pointer and insert the new command
    if (this.undoStackPointer < this.undoStack.length && this.undoStack.length > 0) {
      this.undoStack = this.undoStack.splice(0, this.undoStackPointer);
    }
    this.undoStack.push(cmd);
    this.undoStackPointer = this.undoStack.length;
    const isInitCommand = this.undoStack.length === 1 && cmd.getText() === 'Create Layer';
    if (!isInitCommand) {
      currentFileManager.setHasUnsavedChanges(true);
    }
    // console.log(this.undoStack);
  }

  beginUndoableChange(attrName: string, elems: Element[]): void {
    this.undoChangeStackPointer += 1;
    const p = this.undoChangeStackPointer;
    const elements = elems.filter((elem) => !!elem);
    const oldValues = elements.map((elem) => elem.getAttribute(attrName));
    this.undoableChangeStack[p] = { attrName, oldValues, elements };
  }

  finishUndoableChange(): IBatchCommand {
    const p = this.undoChangeStackPointer;
    this.undoChangeStackPointer -= 1;
    const changeset = this.undoableChangeStack[p];
    const { attrName, elements, oldValues } = changeset;
    const batchCmd = new history.BatchCommand(`Change ${attrName}`);
    for (let i = elements.length - 1; i >= 0; i -= 1) {
      const elem = elements[i];
      if (elem == null) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const changes = {};
      changes[attrName] = oldValues[i];
      if (changes[attrName] !== elem.getAttribute(attrName)) {
        batchCmd.addSubCommand(new history.ChangeElementCommand(elem, changes, attrName));
      }
    }
    this.undoableChangeStack[p] = null;
    return batchCmd;
  }
}

// singleton
const undoManager = new UndoManager(null);

export default undoManager;
