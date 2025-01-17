declare global {
  namespace Cypress {
    interface Chainable {
      landingEditor(): Chainable<void>;
      loginAndLandingEditor(): Chainable<void>;
      uploadFile(fileName: string, fileType?: string): Chainable<JQuery<HTMLElement>>;
      dragTo(targetEl: string): Chainable<JQuery<HTMLElement>>;
      disableImageDownSampling(): Chainable<void>;
      setUpBackend: (ip: string) => Chainable<void>;
      connectMachine: (ip: string) => Chainable<void>;
      go2Preference: (handleSave?: boolean) => Chainable<void>;
      checkToolBtnActive: (id: string, active?: boolean) => Chainable<void>;
      clickToolBtn: (id: string) => Chainable<void>;
      changeWorkarea: (workarea: string, save?: boolean) => Chainable<void>;
      selectPreset: (presetName: string) => Chainable<void>;
      inputValueCloseTo: (selector: string, value: number, tolerance: number) => Chainable<void>;
      inputText: (value: string) => Chainable<void>;
    }
  }
}

export {};
