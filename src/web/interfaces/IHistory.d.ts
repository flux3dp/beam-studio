export interface ICommand {
  elem: Element,
  type?: string,
  text?: string,
  oldNextSibling?: Element,
  oldParent?: Element,
  newNextSibling?: Element,
  newParent?: Element,
  elements?: () => Element[],
}

export interface IBatchCommand extends ICommand {
  addSubCommand: (cmd: ICommand) => void,
  isEmpty: () => boolean,
}
