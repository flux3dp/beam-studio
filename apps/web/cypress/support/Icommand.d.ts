declare global {
  namespace Cypress {
    interface Chainable {
      landingEditor(opts?: Partial<Cypress.VisitOptions>): Chainable<void>;
      loginAndLandingEditor(opts?: Partial<Cypress.VisitOptions>): Chainable<void>;
      uploadFile(fileName: string, fileType?: string): Chainable<JQuery<HTMLElement>>;
      /**
       * Upload a bitmap image and wait for it to be fully processed
       * Automatically waits for the image element to have valid base64 data
       * @param fileName - The fixture file name (e.g., 'flux.png')
       * @param options - Optional { selector?: string, timeout?: number }
       */
      uploadImage(fileName: string, options?: { selector?: string; timeout?: number }): Chainable<JQuery<HTMLElement>>;
      dragTo(targetEl: string): Chainable<JQuery<HTMLElement>>;
      disableImageDownSampling(): Chainable<void>;
      setUpBackend: (ip: string) => Chainable<void>;
      connectMachine: (ip: string) => Chainable<void>;
      go2Preference: (handleSave?: boolean) => Chainable<void>;
      /** Navigate to a specific settings category in the settings modal sidebar */
      goToSettingsCategory: (category: string) => Chainable<void>;
      /** Apply settings in the new settings modal */
      applySettings: () => Chainable<void>;
      checkToolBtnActive: (id: string, active?: boolean) => Chainable<void>;
      clickToolBtn: (id: string, checkActive?: boolean) => Chainable<void>;
      changeWorkarea: (workarea: string, save?: boolean) => Chainable<void>;
      selectPreset: (presetName: string | RegExp) => Chainable<void>;
      inputValueCloseTo: (selector: string, value: number, tolerance: number) => Chainable<void>;
      inputText: (value: string) => Chainable<void>;
      getElementTitle: (childSelector?: string) => Chainable<JQuery<HTMLElement>>;
      getTopBar: (childSelector?: string) => Chainable<JQuery<HTMLElement>>;
      moveElementToLayer: (targetLayer: string, needConfirm?: boolean) => Chainable<void>;
      /** Wait for progress/loading indicators to disappear */
      waitForProgress: (timeout?: number) => Chainable<void>;
      /** Wait for heavy operations like image processing to complete */
      waitForImageProcessing: (timeout?: number) => Chainable<void>;
    }
  }
}

export {};
