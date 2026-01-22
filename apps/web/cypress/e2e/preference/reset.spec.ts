describe('reset', () => {
  const isRunningAtGithub = Cypress.env('envType') === 'github';

  beforeEach(() => {
    cy.landingEditor();
  });

  const resetBeamStudio = () => {
    ['Reset Beam Studio', 'Next', 'Sign in later', 'Skip', 'New Project'].forEach((text) => cy.contains(text).click());

    const buttonCount = isRunningAtGithub ? 1 : 3;

    for (let i = 0; i < buttonCount; i++) {
      cy.get('button.ant-btn').contains('No').click({ multiple: true });
    }
  };

  const selectOption = (selector, optionText) => {
    cy.get(selector).closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content', { timeout: 15000 })
      .contains(optionText)
      .click();
  };

  it('resets unit preference', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    selectOption('#set-default-units', 'Inches');
    cy.applySettings();
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    cy.get('#set-default-units')
      .closest('.ant-select')
      .find('.ant-select-selection-item')
      .should('have.text', 'Inches');

    resetBeamStudio();

    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    cy.get('#set-default-units').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'mm');
  });

  it('resets open-bottom, autofocus, and diode preferences', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Add-on');
    // Switches - click to toggle on
    ['#default-open-bottom', '#default-autofocus', '#default-diode'].forEach((selector) => {
      cy.get(selector).click();
    });
    cy.applySettings();
    cy.go2Preference();
    cy.goToSettingsCategory('Add-on');
    // Verify switches are on
    ['#default-open-bottom', '#default-autofocus', '#default-diode'].forEach((selector) =>
      cy.get(selector).should('have.attr', 'aria-checked', 'true'),
    );

    resetBeamStudio();

    cy.go2Preference();
    cy.goToSettingsCategory('Add-on');
    // Verify switches are reset to off
    ['#default-open-bottom', '#default-autofocus', '#default-diode'].forEach((selector) =>
      cy.get(selector).should('have.attr', 'aria-checked', 'false'),
    );
  });
});
