export interface IMenuEventListenerFactory {
  createMenuEventListener(): {
    on(action: string, callback: Function): void;
  };
}
