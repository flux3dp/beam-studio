/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Package: svgedit.history
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2016 Flint O'Brien
 */

import history from 'app/svgedit/history/history';
import { IBatchCommand, ICommand, IUndoManager } from 'interfaces/IHistory';

const { svgedit } = window;

if (!svgedit.history) {
  svgedit.history = {};
}

/**
 * History recording service.
 *
 * A self-contained service interface for recording history. Once injected, no other dependencies
 * or globals are required (example: UndoManager, command types, etc.). Easy to mock for unit tests.
 * Built on top of history classes in history.js.
 *
 * There is a simple start/end interface for batch commands.
 *
 * HistoryRecordingService.NO_HISTORY is a singleton that can be passed in to functions
 * that record history. This helps when the caller requires that no history be recorded.
 *
 * Usage:
 * The following will record history: insert, batch, insert.
 * ```
 * hrService = new svgedit.history.HistoryRecordingService(this.undoMgr);
 * hrService.insertElement(elem, text); // add simple command to history.
 * hrService.startBatchCommand('create two elements');
 * hrService.changeElement(elem, attrs, text); // add to batchCommand
 * hrService.changeElement(elem, attrs2, text); // add to batchCommand
 * hrService.endBatchCommand(); // add batch command with two change commands to history.
 * hrService.insertElement(elem, text); // add simple command to history.
 * ```
 *
 * Note that all functions return this, so commands can be chained, like so:
 *
 * ```
 * hrService
 *   .startBatchCommand('create two elements')
 *   .insertElement(elem, text)
 *   .changeElement(elem, attrs, text)
 *   .endBatchCommand();
 * ```
 *
 * @param {IUndoManager} undoManager - The undo manager.
 * A value of null is valid for cases where no history recording is required.
 * See singleton: HistoryRecordingService.NO_HISTORY
 */
class HistoryRecordingService {
  private undoManager: IUndoManager;

  private currentBatchCommand: IBatchCommand;

  private batchCommandStack: IBatchCommand[];

  constructor(undoManager?: IUndoManager) {
    this.undoManager = undoManager;
    this.currentBatchCommand = null;
    this.batchCommandStack = [];
  }

  /**
   * Private function to add a command to the history or current batch command.
   */
  private addCommand(cmd: ICommand) {
    if (!this.undoManager) { return this; }
    if (this.currentBatchCommand) {
      this.currentBatchCommand.addSubCommand(cmd);
    } else {
      this.undoManager.addCommandToHistory(cmd);
    }
    return this;
  }

  /**
   * Start a batch command so multiple commands can recorded as a single history command.
   * Requires a corresponding call to endBatchCommand. Start and end commands can be nested.
   */
  startBatchCommand(text: string): HistoryRecordingService {
    if (!this.undoManager) { return this; }
    this.currentBatchCommand = new history.BatchCommand(text);
    this.batchCommandStack.push(this.currentBatchCommand);
    return this;
  }

  /**
   * End a batch command and add it to the history or a parent batch command.
   */
  endBatchCommand(): HistoryRecordingService {
    if (!this.undoManager) { return this; }
    if (this.currentBatchCommand) {
      const batchCommand = this.currentBatchCommand;
      this.batchCommandStack.pop();
      const l = this.batchCommandStack.length;
      this.currentBatchCommand = l ? this.batchCommandStack[l - 1] : null;
      this.addCommand(batchCommand);
    }
    return this;
  }

  /**
   * Add a MoveElementCommand to the history or current batch command
   * @param elem - The DOM element that was moved
   * @param oldNextSibling - The element's next sibling before it was moved
   * @param oldParent - The element's parent before it was moved
   * @param text - An optional string visible to user related to this change
   */
  moveElement(
    elem: Element,
    oldNextSibling: Node | Element,
    oldParent: Node | Element,
    text?: string,
  ): HistoryRecordingService {
    if (!this.undoManager) { return this; }
    this.addCommand(new history.MoveElementCommand(elem, oldNextSibling, oldParent, text));
    return this;
  }

  /**
   * Add an InsertElementCommand to the history or current batch command
   * @param elem - The DOM element that was added
   * @param text - An optional string visible to user related to this change
   */
  insertElement(elem: Element | SVGGraphicsElement, text?: string): HistoryRecordingService {
    if (!this.undoManager) { return this; }
    this.addCommand(new history.InsertElementCommand(elem, text));
    return this;
  }

  /**
   * Add a RemoveElementCommand to the history or current batch command
   * @param elem - The DOM element that was removed
   * @param oldNextSibling - The element's next sibling before it was removed
   * @param oldParent - The element's parent before it was removed
   * @param text - An optional string visible to user related to this change
   */
  removeElement(
    elem: Element | SVGGraphicsElement,
    oldNextSibling: Node | Element,
    oldParent: Node | Element,
    text?: string,
  ): HistoryRecordingService {
    if (!this.undoManager) { return this; }
    this.addCommand(new history.RemoveElementCommand(elem, oldNextSibling, oldParent, text));
    return this;
  }

  /**
   * Add a ChangeElementCommand to the history or current batch command
   * @param elem - The DOM element that was changed
   * @param attrs - An object with the attributes to be changed and the
   * values they had *before* the change
   * @param text - An optional string visible to user related to this change
   */
  changeElement(
    elem: Element,
    attrs: { [key: string]: any },
    text?: string,
  ): HistoryRecordingService {
    if (!this.undoManager) { return this; }
    this.addCommand(new history.ChangeElementCommand(elem, attrs, text));
    return this;
  }
}
svgedit.history.HistoryRecordingService = HistoryRecordingService;

const NO_HISTORY = new HistoryRecordingService();

export default {
  HistoryRecordingService,
  NO_HISTORY,
};
