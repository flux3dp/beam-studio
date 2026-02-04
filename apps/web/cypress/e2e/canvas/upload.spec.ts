const layerListPrefix = '_-_-packages-core-src-web-app-components-beambox-RightPanel-LayerPanel-LayerList-module__';
const moduleBlockPrefix =
  '_-_-packages-core-src-web-app-components-beambox-RightPanel-ConfigPanel-ModuleBlock-module__';

describe('upload tools', () => {
  it('upload png', () => {
    cy.landingEditor();
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#svg_1').should('exist');
    cy.get('#w_size').should('have.value', '300');
    cy.get('#h_size').should('have.value', '210');
  });

  it('upload jpg', () => {
    cy.landingEditor();
    cy.uploadFile('map.jpg', 'image/jpg');
    cy.get('#svg_1').should('exist');
    cy.get('#w_size').should('have.value', '553');
    cy.get('#h_size').should('have.value', '387.9');
  });

  it('upload dxf', () => {
    cy.landingEditor();
    cy.uploadFile('basket.dxf');
    cy.contains('.ant-modal-content', 'The version of this DXF file is not 2013')
      .contains('OK')
      .should('be.exist')
      .click();
    cy.contains('.ant-modal-content', 'Please enter the Unit of your file (in mm)')
      .contains('OK')
      .should('be.exist')
      .click();
    cy.contains('.ant-modal-content', 'Drawing size is out of workarea.').contains('OK').should('be.exist').click();
    cy.get('#svg_1').should('exist');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    // Wait for element size to be computed
    cy.get('#w_size').should('have.attr', 'value').and('eq', '522.17');
    cy.get('#h_size').should('have.attr', 'value').and('eq', '465.52');
  });

  it('upload printing beam to laser layer', () => {
    cy.landingEditor();
    cy.changeWorkarea('Ador');
    cy.uploadFile('printing.beam');
    cy.get(`div[class*="${layerListPrefix}row"]`).should('have.attr', 'data-layer', '預設圖層');
    cy.get(`div[class*="${moduleBlockPrefix}select"]`).should('have.text', 'Printing');
  });

  it('upload laser beam to printing layer', () => {
    cy.landingEditor();
    cy.changeWorkarea('Ador');
    cy.get(`div[class*="${moduleBlockPrefix}select"]`).as('module');
    cy.get('@module').should('have.text', '20W Diode Laser');
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).click();
    cy.get('.ant-select-item-option-content').contains('Printing').click();
    cy.get('.ant-modal-title')
      .contains('Do you want to convert the Laser module into Printing module?')
      .should('exist');
    cy.get('button.ant-btn').contains('Confirm').should('exist').click();
    cy.get('@module').should('have.text', 'Printing');
    cy.uploadFile('laser.beam');
    cy.get(`div[class*="${layerListPrefix}row"]`).should('have.attr', 'data-layer', '預設圖層');
    cy.get('@module').should('have.text', '20W Diode Laser');
  });

  it('upload printing beam to beamseries', () => {
    cy.landingEditor();
    cy.uploadFile('printing.beam');
    cy.get('.ant-modal-content')
      .contains('The document contains printing layer, would you like to change workarea to Ador?')
      .should('exist');
    cy.get('.ant-btn').contains('Yes').click();
    cy.get(`div[class*="${layerListPrefix}row"]`).should('have.attr', 'data-layer', '預設圖層');
    cy.get(`div[class*="${moduleBlockPrefix}select"]`).should('have.text', 'Printing');
  });
});
