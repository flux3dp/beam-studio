describe('manipulate document setting (modules)', () => {
  beforeEach(() => {
    cy.landingEditor();
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
