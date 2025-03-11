describe('ador layer', () => {
  const addLayerBtnPrefix = '_-_-packages-core-src-web-app-components-beambox-right-panel-AddLayerButton-module__';
  const moduleBlockPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-ConfigPanel-ModuleBlock-module__';

  const change2PrintingModule = () => {
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).click();
    cy.get('.ant-select-item-option-content').contains('Printing').click();
    cy.get('.ant-modal-title').should('have.text', 'Do you want to convert the Laser module into Printing module?');
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', 'Printing');
  };

  const getLayerPanelValue = (label: string) => cy.contains(label).siblings().eq(0);

  const dragSlider = (id: string, dx: number) => {
    cy.get(`#${id} div.ant-slider-handle`).trigger('mousedown');
    cy.get(`#${id} div.ant-slider-handle`).trigger('mousemove', dx, 0, { force: true });
    cy.get(`#${id} div.ant-slider-handle`).trigger('mouseup');
  };

  beforeEach(() => {
    cy.landingEditor();
  });

  it('change default laser module', () => {
    cy.go2Preference();
    cy.get('#default-laser-module').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains('10W Diode Laser').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', '10W Diode Laser');
    cy.get('.btn.btn-done').contains('Apply').click();
    cy.changeWorkarea('Ador');
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', '10W Diode Laser');
  });

  it('merge printing and laser layers', () => {
    cy.changeWorkarea('Ador');
    cy.get(`button[class*="${addLayerBtnPrefix}btn"]`).click({ force: true });
    change2PrintingModule();
    cy.get(`button[class*="${addLayerBtnPrefix}btn"]`).click({ force: true });
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', '20W Diode Laser');

    cy.get('div[data-layer="Layer 3"]').eq(1).rightclick();
    cy.get('#merge_down_layer').click();
    cy.get('.ant-modal-title').should('have.text', 'Do you want to merge these layers into one Printing layer?');
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', 'Printing');

    cy.get('div[data-layer="Layer 2"]').eq(1).rightclick();
    cy.get('#merge_down_layer').click();
    cy.get('.ant-modal-title').should('have.text', 'Do you want to merge these layers into one Laser layer?');
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', '20W Diode Laser');
  });

  it('move to printing or laser layers', () => {
    cy.changeWorkarea('Ador');
    cy.get(`button[class*="${addLayerBtnPrefix}btn"]`).click({ force: true });
    change2PrintingModule();
    cy.clickToolBtn('Element');
    cy.get('.anticon[id="basic/icon-circle"]').click();
    cy.get('#svg_1').click();
    cy.get('.tab.layers').click();
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', 'Printing');

    cy.contains('Move elements to:').siblings().select('Layer 1');
    cy.get('.ant-modal-title').should(
      'have.text',
      'Move selected element to Layer 1 and convert it into laser element?',
    );
    cy.get('button.ant-btn').contains('Cancel').should('exist');
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', '20W Diode Laser');

    cy.get('#svg_1').click();
    cy.contains('Move elements to:').siblings().select('Layer 2');
    cy.get('.ant-modal-title').should(
      'have.text',
      'Move selected element to Layer 2 and convert it into printing element?',
    );
    cy.get('button.ant-btn').contains('Cancel').should('exist');
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).should('have.text', 'Printing');
  });

  it('advanced printing parameter off', () => {
    cy.go2Preference();

    cy.get('#print-advanced-mode').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains('Off').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Off');
    cy.get('.btn.btn-done').contains('Apply').click();
    cy.changeWorkarea('Ador');
    change2PrintingModule();

    getLayerPanelValue('Saturation').should('have.text', 'Regular');
    dragSlider('saturation', -100);
    getLayerPanelValue('Saturation').should('have.text', 'Min');
    dragSlider('saturation', 50);
    getLayerPanelValue('Saturation').should('have.text', 'Low');
    dragSlider('saturation', 100);
    getLayerPanelValue('Saturation').should('have.text', 'High');
    dragSlider('saturation', 50);
    getLayerPanelValue('Saturation').should('have.text', 'Max');

    getLayerPanelValue('Speed').should('have.text', 'Regular');
    dragSlider('speed', -100);
    getLayerPanelValue('Speed').should('have.text', 'Slowest');
    dragSlider('speed', 50);
    getLayerPanelValue('Speed').should('have.text', 'Slow');
    dragSlider('speed', 100);
    getLayerPanelValue('Speed').should('have.text', 'Fast');
    dragSlider('speed', 50);
    getLayerPanelValue('Speed').should('have.text', 'Fastest');

    getLayerPanelValue('Multi-pass').should('have.text', '3');
    dragSlider('multipass', -30);
    getLayerPanelValue('Multi-pass').should('have.text', '2');
    dragSlider('multipass', 150);
    getLayerPanelValue('Multi-pass').should('have.text', '4');
    dragSlider('multipass', 50);
    getLayerPanelValue('Multi-pass').should('have.text', '5');
  });

  it('advanced printing parameter on', () => {
    cy.go2Preference();

    cy.get('#print-advanced-mode').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains('On').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'On');
    cy.get('[class="btn btn-done"]').contains('Apply').click();
    cy.changeWorkarea('Ador');
    change2PrintingModule();

    cy.get('#saturation-input').should('have.value', '3');
    dragSlider('saturation', -200);
    cy.get('#saturation-input').should('have.value', '1');
    dragSlider('saturation', 500);
    cy.get('#saturation-input').should('have.value', '15');
    cy.get('#saturation-input').clear().type('5');
    cy.get('#saturation-input').should('have.value', '5');

    cy.get('#speed-input').should('have.value', '60');
    dragSlider('speed', -200);
    cy.get('#speed-input').should('have.value', '0.5');
    dragSlider('speed', 500);
    cy.get('#speed-input').should('have.value', '400');
    cy.get('#speed-input').clear().type('100');
    cy.get('#speed-input').should('have.value', '100');

    cy.get('#multipass-input').should('have.value', '3');
    dragSlider('multipass', -200);
    cy.get('#multipass-input').should('have.value', '1');
    dragSlider('multipass', 500);
    cy.get('#multipass-input').should('have.value', '10');
    cy.get('#multipass-input').clear().type('5');
    cy.get('#multipass-input').should('have.value', '5');
  });
});
