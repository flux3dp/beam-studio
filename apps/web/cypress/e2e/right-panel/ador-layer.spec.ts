describe('ador layer', () => {
  const addLayerBtnPrefix = 'AddLayerButton-module__';
  const moduleBlockPrefix = 'ModuleBlock-module__';

  const change2PrintingModule = () => {
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).click();
    cy.contains('.ant-select-item-option-content', 'Printing').click();
    cy.get('.ant-modal-title').should('have.text', 'Do you want to convert the Laser module into Printing module?');
    cy.contains('button.ant-btn', 'Confirm').click({ force: true });
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', 'Printing');
  };

  const getLayerPanelValue = (label: string) => cy.contains(label).siblings().eq(0);

  const dragSlider = (id: string, dx: number) => {
    cy.get(`#${id} div.ant-slider-handle`)
      .trigger('mousedown')
      .trigger('mousemove', dx, 0, { force: true })
      .trigger('mouseup');
  };

  const selectOption = (selector: string, optionText: string) => {
    cy.get(selector).closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains(optionText).click({ force: true });
  };

  beforeEach(() => {
    cy.landingEditor();
  });

  it('change default laser module', () => {
    cy.go2Preference();
    // First select "Ador" in the Module section to show Ador-specific settings
    selectOption('#module-selector', 'Ador');
    selectOption('#default-laser-module', '10W Diode Laser');
    cy.contains('.btn.btn-done', 'Apply').click();
    cy.changeWorkarea('Ador');
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', '10W Diode Laser');
  });

  it('merge printing and laser layers', () => {
    cy.changeWorkarea('Ador');
    cy.get(`button[class*="${addLayerBtnPrefix}btn"]`).click({ force: true });
    change2PrintingModule();
    cy.get(`button[class*="${addLayerBtnPrefix}btn"]`).click({ force: true });
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', '20W Diode Laser');

    const mergeLayer = (layer: string, expectedText: string) => {
      cy.get(`div[data-layer="${layer}"]`).eq(1).rightclick();
      cy.get('#merge_down_layer').click();
      cy.get('.ant-modal-title').should('have.text', expectedText);
      cy.contains('button.ant-btn', 'Confirm').click({ force: true });
    };

    mergeLayer('Layer 3', 'Do you want to merge these layers into one Printing layer?');
    mergeLayer('Layer 2', 'Do you want to merge these layers into one Laser layer?');
  });

  it('move to printing or laser layers', () => {
    cy.changeWorkarea('Ador');
    cy.get(`button[class*="${addLayerBtnPrefix}btn"]`).click({ force: true });
    change2PrintingModule();
    cy.clickToolBtn('Element', false);
    cy.get('.anticon[id="basic/icon-circle"]').click();
    cy.get('#svg_1').click({ force: true });
    cy.get('.tab.layers').click();
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', 'Printing');

    const moveElement = (layer: string, expectedText: string) => {
      // Click twice to prevent flaky issue where first click sometimes fails to select the element
      cy.get('#svg_1').should('exist').should('be.visible').click({ force: true });
      cy.get('#svg_1').should('exist').should('be.visible').click({ force: true });
      cy.moveElementToLayer(layer, false);
      cy.get('.ant-modal-title').should('have.text', expectedText);
      cy.contains('button.ant-btn', 'Confirm').click({ force: true });
      cy.get('#svg_1').parent().find('title').should('have.text', layer);
    };

    moveElement('Layer 1', 'Move selected element to Layer 1 and convert it into laser element?');
    moveElement('Layer 2', 'Move selected element to Layer 2 and convert it into printing element?');
  });

  it('advanced printing parameter off', () => {
    cy.go2Preference();
    // Switch - ensure it's off (default should be false)
    cy.get('#print-advanced-mode').should('have.attr', 'aria-checked', 'false');
    cy.contains('.btn.btn-done', 'Apply').click();
    cy.changeWorkarea('Ador');
    change2PrintingModule();

    const testSlider = (id: string, label: string, steps: { dx: number; expected: string }[]) => {
      steps.forEach(({ dx, expected }) => {
        dragSlider(id, dx);
        getLayerPanelValue(label).should('have.text', expected);
      });
    };

    testSlider('saturation', 'Saturation', [
      { dx: -100, expected: 'Min' },
      { dx: 50, expected: 'Low' },
      { dx: 100, expected: 'High' },
      { dx: 50, expected: 'Max' },
    ]);

    testSlider('speed', 'Speed', [
      { dx: -100, expected: 'Slowest' },
      { dx: 50, expected: 'Slow' },
      { dx: 100, expected: 'Fast' },
      { dx: 50, expected: 'Fastest' },
    ]);

    testSlider('multipass', 'Multi-pass', [
      { dx: -30, expected: '2' },
      { dx: 150, expected: '4' },
      { dx: 50, expected: '5' },
    ]);
  });

  it('advanced printing parameter on', () => {
    cy.go2Preference();
    // Switch - click to toggle on
    cy.get('#print-advanced-mode').click();
    cy.get('#print-advanced-mode').should('have.attr', 'aria-checked', 'true');
    cy.contains('.btn.btn-done', 'Apply').click();
    cy.changeWorkarea('Ador');
    change2PrintingModule();

    const testAdvancedSlider = (id: string, inputId: string, steps: { dx: number; expected: string }[]) => {
      steps.forEach(({ dx, expected }) => {
        dragSlider(id, dx);
        cy.get(`#${inputId}`).should('have.value', expected);
      });
    };

    testAdvancedSlider('saturation', 'saturation-input', [
      { dx: -200, expected: '1' },
      { dx: 500, expected: '15' },
    ]);
    cy.get('#saturation-input').clear().type('5').should('have.value', '5');

    testAdvancedSlider('speed', 'speed-input', [
      { dx: -200, expected: '0.5' },
      { dx: 500, expected: '400' },
    ]);
    cy.get('#speed-input').clear().type('100').should('have.value', '100');

    testAdvancedSlider('multipass', 'multipass-input', [
      { dx: -200, expected: '1' },
      { dx: 500, expected: '10' },
    ]);
    cy.get('#multipass-input').clear().type('5').should('have.value', '5');
  });
});
