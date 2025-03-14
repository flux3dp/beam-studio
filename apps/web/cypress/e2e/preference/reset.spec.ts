describe('reset', () => {
  const isRunningAtGithub = Cypress.env('envType') === 'github';

  beforeEach(() => {
    cy.landingEditor();
  });

  const resetBeamStudio = () => {
    ['Reset Beam Studio', 'Next', 'Work Offline', 'Skip'].forEach((text) => cy.contains(text).click());

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
    selectOption('#set-default-units', 'Inches');
    cy.get('.btn.btn-done').click();
    cy.go2Preference();
    cy.get('#set-default-units')
      .closest('.ant-select')
      .find('.ant-select-selection-item')
      .should('have.text', 'Inches');

    resetBeamStudio();

    cy.go2Preference();
    cy.get('#set-default-units').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'mm');
  });

  it('resets open-bottom, autofocus, and diode preferences', () => {
    cy.go2Preference();
    ['#default-open-bottom', '#default-autofocus', '#default-diode'].forEach((selector) =>
      selectOption(selector, 'On'),
    );
    cy.get('.btn.btn-done').click();
    cy.go2Preference();
    ['#default-open-bottom', '#default-autofocus', '#default-diode'].forEach((selector) =>
      cy.get(selector).closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'On'),
    );

    resetBeamStudio();

    cy.go2Preference();
    ['#default-open-bottom', '#default-autofocus', '#default-diode'].forEach((selector) =>
      cy.get(selector).closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'Off'),
    );
  });
});
