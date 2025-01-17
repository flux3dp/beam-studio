/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
/**
 * Package: svedit.history
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Jeff Schiller
 */

// Dependencies:
// 1) jQuery
// 2) svgtransformlist.js
// 3) svgutils.js
import { IBatchCommand, ICommand, IHistoryHandler } from 'interfaces/IHistory';

const { svgedit } = window;

if (!svgedit.history) {
  svgedit.history = {};
}

// Group: Undo/Redo history management
export const HistoryEventTypes = {
  BEFORE_APPLY: 'before_apply',
  AFTER_APPLY: 'after_apply',
  BEFORE_UNAPPLY: 'before_unapply',
  AFTER_UNAPPLY: 'after_unapply',
};
svgedit.history.HistoryEventTypes = HistoryEventTypes;

export class BaseHistoryCommand implements ICommand {
  public elem: SVGGraphicsElement;

  public text: string;

  type = (): string => 'BaseHistoryCommand';

  getText(): string {
    return this.text;
  }

  elements(): Element[] {
    return [this.elem];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  doApply = (handler?: IHistoryHandler): void => {
    throw Error('apply not implemented');
  };

  apply(handler?: IHistoryHandler): void {
    handler?.handleHistoryEvent(HistoryEventTypes.BEFORE_APPLY, this);
    this.onBefore?.();
    this.doApply(handler);
    this.onAfter?.();
    handler?.handleHistoryEvent(HistoryEventTypes.AFTER_APPLY, this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  doUnapply = (handler?: IHistoryHandler): void => {
    throw Error('unapply not implemented');
  };

  unapply(handler?: IHistoryHandler): void {
    handler?.handleHistoryEvent(HistoryEventTypes.BEFORE_UNAPPLY, this);
    this.onBefore?.();
    this.doUnapply(handler);
    this.onAfter?.();
    handler?.handleHistoryEvent(HistoryEventTypes.AFTER_UNAPPLY, this);
  }

  onBefore: () => void = null;

  onAfter: () => void = null;
}

class MoveElementCommand extends BaseHistoryCommand implements ICommand {
  private oldNextSibling: Node | Element;

  private newNextSibling: Node | Element;

  public oldParent: Node | Element;

  public newParent: Node | Element;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(elem: any, oldNextSibling: Node | Element, oldParent: Element | Node, text?: string) {
    super();
    this.elem = elem as SVGGraphicsElement;
    this.text = text ? `Move ${elem.tagName} to ${text}` : `Move ${elem.tagName}`;
    this.oldNextSibling = oldNextSibling;
    this.oldParent = oldParent;
    this.newNextSibling = elem.nextSibling;
    this.newParent = elem.parentNode;
  }

  static type(): string {
    return 'svgedit.history.MoveElementCommand';
  }

  type = MoveElementCommand.type;

  doApply = (): void => {
    this.newParent.insertBefore(this.elem, this.newNextSibling);
  };

  doUnapply = (): void => {
    this.oldParent.insertBefore(this.elem, this.oldNextSibling);
  };
}
svgedit.history.MoveElementCommand = MoveElementCommand;

// History command for an element that was added to the DOM
class InsertElementCommand extends BaseHistoryCommand implements ICommand {
  private nextSibling: Node | Element;

  private parent: Node | Element;

  constructor(elem: Element | SVGGraphicsElement, text?: string) {
    super();
    this.elem = elem as SVGGraphicsElement;
    this.text = text || `Create ${elem.tagName}`;
    this.parent = elem.parentNode;
    this.nextSibling = this.elem.nextSibling;
  }

  static type(): string {
    return 'svgedit.history.InsertElementCommand';
  }

  type = InsertElementCommand.type;

  doApply = (): void => {
    this.parent.insertBefore(this.elem, this.nextSibling);
  };

  doUnapply = (): void => {
    this.parent = this.elem.parentNode;
    this.parent.removeChild(this.elem);
  };
}
svgedit.history.InsertElementCommand = InsertElementCommand;

// History command for an element removed from the DOM
class RemoveElementCommand extends BaseHistoryCommand implements ICommand {
  private nextSibling: Node | Element;

  private parent: Node | Element;

  constructor(
    elem: Element | SVGGraphicsElement,
    oldNextSibling: Node | Element,
    oldParent: Node | Element,
    text?: string
  ) {
    super();
    this.elem = elem as SVGGraphicsElement;
    this.text = text || `Delete ${elem.tagName}`;
    this.nextSibling = oldNextSibling;
    this.parent = oldParent;

    // special hack for webkit: remove this element's entry in the svgTransformLists map
    svgedit.transformlist.removeElementFromListMap(elem);
  }

  static type(): string {
    return 'svgedit.history.RemoveElementCommand';
  }

  type = RemoveElementCommand.type;

  doApply = (): void => {
    svgedit.transformlist.removeElementFromListMap(this.elem);
    this.parent = this.elem.parentNode;
    this.parent.removeChild(this.elem);
  };

  doUnapply = (): void => {
    svgedit.transformlist.removeElementFromListMap(this.elem);
    this.parent.insertBefore(this.elem, this.nextSibling);
  };
}
svgedit.history.RemoveElementCommand = RemoveElementCommand;

// History command to make a change to an element.
// Usually an attribute change, but can also be textcontent.
class ChangeElementCommand extends BaseHistoryCommand implements ICommand {
  public newValues: { [key: string]: any };

  public oldValues: { [key: string]: any };

  constructor(elem: Element | SVGGraphicsElement, attrs: { [key: string]: any }, text?: string) {
    super();
    this.elem = elem as SVGGraphicsElement;
    this.text = `Change ${elem.tagName}${text ? ` ${text}` : ''}`;
    this.newValues = {};
    this.oldValues = attrs;
    const keys = Object.keys(attrs);
    for (let i = 0; i < keys.length; i += 1) {
      const attr = keys[i];
      if (attr === '#text') {
        this.newValues[attr] = elem.textContent;
      } else if (attr === '#href') {
        this.newValues[attr] = svgedit.utilities.getHref(elem);
      } else {
        const curVal = elem.getAttribute(attr);
        if (curVal === attrs[attr] || (!curVal && !attrs[attr])) {
          delete this.oldValues[attr];
        } else this.newValues[attr] = curVal;
      }
    }
  }

  static type(): string {
    return 'svgedit.history.ChangeElementCommand';
  }

  type = ChangeElementCommand.type;

  doApply = (): void => {
    let bChangedTransform = false;
    const keys = Object.keys(this.newValues);
    for (let i = 0; i < keys.length; i += 1) {
      const attr = keys[i];
      if (this.newValues[attr]) {
        if (attr === '#text') {
          this.elem.textContent = this.newValues[attr];
        } else if (attr === '#href') {
          svgedit.utilities.setHref(this.elem, this.newValues[attr]);
        } else {
          this.elem.setAttribute(attr, this.newValues[attr]);
        }
      } else if (attr === '#text') {
        this.elem.textContent = '';
      } else {
        this.elem.setAttribute(attr, '');
        this.elem.removeAttribute(attr);
      }
      if (!bChangedTransform && attr === 'transform') {
        bChangedTransform = true;
      }
    }

    // relocate rotational transform, if necessary
    if (!bChangedTransform) {
      const angle = svgedit.utilities.getRotationAngle(this.elem);
      if (angle) {
        // TODO: These instances of elem either need to be declared as global
        // (which would not be good for conflicts) or declare/use this.elem
        const bbox = this.elem.getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        const rotate = `rotate(${angle} ${cx}, ${cy})`;
        if (rotate !== this.elem.getAttribute('transform')) {
          this.elem.setAttribute('transform', rotate);
        }
      }
    }
  };

  doUnapply = (): void => {
    let bChangedTransform = false;
    const keys = Object.keys(this.oldValues);
    for (let i = 0; i < keys.length; i += 1) {
      const attr = keys[i];
      if (this.oldValues[attr]) {
        if (attr === '#text') {
          this.elem.textContent = this.oldValues[attr];
        } else if (attr === '#href') {
          svgedit.utilities.setHref(this.elem, this.oldValues[attr]);
        } else {
          this.elem.setAttribute(attr, this.oldValues[attr]);
        }
      } else if (attr === '#text') {
        this.elem.textContent = '';
      } else {
        this.elem.removeAttribute(attr);
      }
      if (!bChangedTransform && attr === 'transform') {
        bChangedTransform = true;
      }
    }
    // relocate rotational transform, if necessary
    if (!bChangedTransform) {
      const angle = svgedit.utilities.getRotationAngle(this.elem);
      if (angle) {
        const bbox = this.elem.getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        const rotate = `rotate(${angle} ${cx}, ${cy})`;
        if (rotate !== this.elem.getAttribute('transform')) {
          this.elem.setAttribute('transform', rotate);
        }
      }
    }

    // Remove transformlist to prevent confusion that causes bugs like 575.
    svgedit.transformlist.removeElementFromListMap(this.elem);
  };
}
svgedit.history.ChangeElementCommand = ChangeElementCommand;

class ChangeTextCommand extends BaseHistoryCommand implements ICommand {
  public oldText: string;

  public newText: string;

  constructor(elem: Element | SVGGraphicsElement, oldText: string, newText: string) {
    super();
    this.elem = elem as SVGGraphicsElement;
    this.text = `Change ${elem.id || elem.tagName} from ${oldText} to ${newText}`;
    this.oldText = oldText;
    this.newText = newText;
  }

  static type(): string {
    return 'svgcanvas.textAction.ChangeTextCommand';
  }

  type = ChangeTextCommand.type;

  doApply = (handler?: IHistoryHandler): void => {
    handler?.renderText?.(this.elem as SVGTextElement, this.newText, false);
  };

  doUnapply = (handler?: IHistoryHandler): void => {
    handler?.renderText?.(this.elem as SVGTextElement, this.oldText, false);
  };
}
svgedit.history.ChangeTextCommand = ChangeTextCommand;

// TODO: create a 'typing' command object that tracks changes in text
// if a new Typing command is created and the top command on the stack is also a Typing
// and they both affect the same element, then collapse the two commands into one

// Class: svgedit.history.BatchCommand
// implements svgedit.history.HistoryCommand
// History command that can contain/execute multiple other commands
//
// Parameters:
// text - An optional string visible to user related to this change
class BatchCommand extends BaseHistoryCommand implements IBatchCommand {
  private stack: BaseHistoryCommand[];

  constructor(text?: string) {
    super();
    this.text = text || 'Batch Command';
    this.stack = [];
  }

  static type(): string {
    return 'svgedit.history.BatchCommand';
  }

  type = BatchCommand.type;

  doApply = (handler?: IHistoryHandler): void => {
    for (let i = 0; i < this.stack.length; i += 1) {
      this.stack[i]?.apply(handler);
    }
  };

  doUnapply = (handler?: IHistoryHandler): void => {
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      this.stack[i]?.unapply(handler);
    }
  };

  elements(): Element[] {
    const elemSet = new Set<Element>();
    for (let i = this.stack.length - 1; i >= 0; i -= 1) {
      const cmd = this.stack[i];
      cmd?.elements().forEach((elem) => {
        elemSet.add(elem);
      });
    }
    const elems = Array.from(elemSet);
    return elems;
  }

  addSubCommand(cmd: BaseHistoryCommand): void {
    this.stack.push(cmd);
  }

  isEmpty(): boolean {
    return this.stack.length === 0;
  }
}
svgedit.history.BatchCommand = BatchCommand;

export default {
  HistoryEventTypes,
  MoveElementCommand,
  ChangeElementCommand,
  InsertElementCommand,
  RemoveElementCommand,
  ChangeTextCommand,
  BatchCommand,
};
