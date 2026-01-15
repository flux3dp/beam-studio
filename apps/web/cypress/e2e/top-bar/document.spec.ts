describe('manipulate document setting', () => {
  const moduleBlockPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-ConfigPanel-ModuleBlock-module__';

  beforeEach(() => {
    cy.landingEditor();
  });

  const openDocument = () => {
    cy.get('div.menu-btn-container').click();
    cy.get('.rc-menu--open > :nth-child(2) > :nth-child(1)').click();
    cy.contains('Document Settings').click();
  };

  it('resolution', () => {
    openDocument();
    // Wait for document settings modal to open
    cy.get('#dpi').should('exist');
    cy.get('#dpi').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Medium (250 DPI)');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains('Low (125 DPI)').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Low (125 DPI)');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains('Detailed (1000 DPI)').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Detailed (1000 DPI)');
  });

  it('working area of beamo', () => {
    cy.changeWorkarea('beamo');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 3000 2100');
  });

  it('working area of beambox', () => {
    cy.changeWorkarea('Beambox');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4000 3750');
  });

  it('working area of beambox pro', () => {
    cy.changeWorkarea('Beambox Pro');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 6000 3750');
  });

  it('working area of HEXA', () => {
    cy.changeWorkarea('HEXA');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 7400 4100');
  });

  it('working area of Ador', () => {
    cy.changeWorkarea('Ador');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');
  });

  it('change Ador printing layer to Beamseries', () => {
    cy.changeWorkarea('Ador');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).click();
    cy.get('.ant-select-item-option-content').contains('Printing').click();
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');
    cy.changeWorkarea('beamo');
    cy.get('.ant-modal-content').should('exist');
    cy.get('[class*="src-web-app-views-dialogs-Alert-module__message-container"]').should(
      'have.text',
      'Do you want to convert the Printing Layers into Laser Layers?',
    );
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 3000 2100');
  });

  const clickAndCheck = (id: string, status: boolean) => {
    cy.get(`button#${id}`).should('have.attr', 'aria-checked', 'false');
    cy.get(`button#${id}`).click();
    cy.get(`button#${id}`).should('have.attr', 'aria-checked', String(status));
  };

  const checkNotExists = (id: string) => {
    cy.get(`button#${id}`).should('not.exist');
  };

  it('check default and adjust setting with working area of beamo', () => {
    cy.changeWorkarea('beamo', false);
    clickAndCheck('rotaryMaster', true);
    clickAndCheck('openBottomMaster', true);
    clickAndCheck('passthroughMaster', true);
    clickAndCheck('autofocus-module', true);
    clickAndCheck('diode_module', true);
  });

  it('check default and adjust setting with working area of beambox', () => {
    cy.changeWorkarea('Beambox', false);
    clickAndCheck('rotaryMaster', true);
    checkNotExists('openBottomMaster');
    checkNotExists('passthroughMaster');
    checkNotExists('autofocus-module');
    checkNotExists('diode_module');
  });

  it('check default and adjust setting with working area of beambox pro', () => {
    cy.changeWorkarea('Beambox Pro', false);
    clickAndCheck('rotaryMaster', true);
    checkNotExists('openBottomMaster');
    checkNotExists('passthroughMaster');
    checkNotExists('autofocus-module');
    checkNotExists('diode_module');
  });

  it('check default and adjust setting with working area of HEXA', () => {
    cy.changeWorkarea('HEXA', false);
    clickAndCheck('rotaryMaster', true);
    checkNotExists('openBottomMaster');
    checkNotExists('passthroughMaster');
    checkNotExists('autofocus-module');
    checkNotExists('diode_module');
  });

  it('check default and adjust setting with working area of Ador', () => {
    cy.changeWorkarea('Ador', false);
    clickAndCheck('rotaryMaster', true);
    checkNotExists('openBottomMaster');
    clickAndCheck('passthroughMaster', true);
    checkNotExists('autofocus-module');
    checkNotExists('diode_module');
  });

  const checkRotary = () => {
    cy.get('#rotaryLine').should('have.attr', 'display', 'visible');
    cy.get('#transparentRotaryLine').should('have.attr', 'display', 'visible');
  };

  it('check rotary with different working area', () => {
    cy.changeWorkarea('beamo', false);
    clickAndCheck('rotaryMaster', true);
    cy.get('button[class^="ant-btn"]').contains('Save').click();
    checkRotary();
    cy.changeWorkarea('Beambox');
    checkRotary();
    cy.changeWorkarea('Beambox Pro');
    checkRotary();
    cy.changeWorkarea('HEXA');
    checkRotary();
    cy.changeWorkarea('Ador', false);
    checkRotary();
  });

  it('check open bottom', () => {
    cy.changeWorkarea('beamo', false);
    clickAndCheck('openBottomMaster', true);
    cy.get('button[class^="ant-btn"]').contains('Save').click();
    cy.get('#boundary-path').should('exist');
    cy.get('#boundary-path').should('have.attr', 'd', 'M0,0H3000V2100H0ZM0,0H2600V2100H0Z');
  });

  it('check autofocus', () => {
    cy.changeWorkarea('beamo', false);
    clickAndCheck('autofocus-module', true);
    cy.get('button[class^="ant-btn"]').contains('Save').click();
    cy.findAllByText('Advanced').should('exist');
    cy.contains('Advanced').click();
    cy.findAllByText('Focus Adjustment').should('exist');
    cy.get('#auto-focus').should('have.attr', 'aria-checked', 'false').click();
    cy.findAllByText('Object Height').should('exist');
    cy.get('#height').should('have.value', '3');
  });

  it('check diode laser', () => {
    cy.changeWorkarea('beamo', false);
    clickAndCheck('diode_module', true);
    cy.get('button[class^="ant-btn"]').contains('Save').click();
    cy.get('#boundary-path').should('exist');
    cy.get('#boundary-path').should('have.attr', 'd', 'M0,0H3000V2100H0ZM0,0H2500V2000H0Z');
    cy.findAllByText('Advanced').should('exist');
    cy.contains('Advanced').click();
    cy.findAllByText('Diode Laser').should('exist');
    cy.get('#diode').should('have.attr', 'aria-checked', 'false').click();
    cy.get('#boundary-path').should('have.attr', 'd', 'M0,0H3000V2100H0ZM700,100H3000V2100H700Z');
  });
});
