import currentFileManager from '@core/app/svgedit/currentFileManager';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand, IHistoryHandler, IUndoManager } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { BaseHistoryCommand } from './history';
import history from './history';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export class UndoManager implements IUndoManager {
  private handler: IHistoryHandler | undefined = undefined;
  private undoStackPointer: number = 0;
  private undoStack: BaseHistoryCommand[] = [];
  private undoChangeStackPointer: number = -1;
  private undoableChangeStack: Array<{ attrName: string; elements: Element[]; oldValues: string[] }> = [];

  constructor() {}

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
    return this.undoStackPointer < this.undoStack.length ? this.undoStack[this.undoStackPointer].getText() : '';
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

    // TODO: if you need to add more function during history change,
    // try to revise this function that accept plugin
    if (!isInitCommand) {
      currentFileManager.setHasUnsavedChanges(true);
      svgCanvas.collectAlignPoints();
    }
  }

  beginUndoableChange(attrName: string, elems: Element[]): void {
    this.undoChangeStackPointer += 1;

    const p = this.undoChangeStackPointer;
    const elements = elems.filter(Boolean);
    const oldValues = elements.map((elem) => elem.getAttribute(attrName)).filter(Boolean);

    this.undoableChangeStack[p] = { attrName, elements, oldValues };
  }

  finishUndoableChange(): IBatchCommand {
    const p = this.undoChangeStackPointer;

    this.undoChangeStackPointer -= 1;

    const changeset = this.undoableChangeStack[p];
    const { attrName, elements, oldValues } = changeset;
    const batchCmd = new history.BatchCommand(`Change ${attrName}`);

    for (let i = elements.length - 1; i >= 0; i -= 1) {
      const elem = elements[i];
      const changes: any = {};

      if (!elem) continue;

      changes[attrName] = oldValues[i];

      if (changes[attrName] !== elem.getAttribute(attrName)) {
        batchCmd.addSubCommand(new history.ChangeElementCommand(elem, changes, attrName));
      }
    }

    // TODO: don't know why we need to set this to null
    this.undoableChangeStack[p] = null as any;

    return batchCmd;
  }
}

// singleton
const undoManager = new UndoManager();

export default undoManager;
