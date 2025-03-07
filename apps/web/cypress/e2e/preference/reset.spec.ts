describe('reset', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('reset unit', () => {
    cy.go2Preference();

    cy.get('#set-default-units').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains('Inches').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Inches');
    cy.get('.btn.btn-done').click();

    cy.go2Preference();

    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Inches');
    cy.contains('Reset Beam Studio').click();
    cy.contains('Next').click();
    cy.contains('Work Offline').click();
    cy.contains('Skip').click();
    cy.get('button.ant-btn').contains('No').click();
    cy.go2Preference();

    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'mm');
  });

  it('reset open-bottom / autofocus / diode', () => {
    const selectOption = (selectId: string, optionText: string) => {
      cy.get(selectId).closest('.ant-select').as('select');
      cy.get('@select').find('.ant-select-selection-item').click();
      // Wait for the dropdown to open
      cy.wait(1000);

      // Ensure the dropdown is open
      cy.get('@select').should('have.class', 'ant-select-open');

      // Scope the search for the option to the currently open dropdown
      cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
        .find('.ant-select-item-option-content')
        .contains(optionText)
        .click({ force: true });

      // Wait for the selection to be applied
      cy.wait(1000);
    };

    cy.go2Preference();

    selectOption('#default-open-bottom', 'On');
    selectOption('#default-autofocus', 'On');
    selectOption('#default-diode', 'On');

    cy.get('.btn.btn-done').click();

    cy.go2Preference();

    cy.wait(1000);
    cy.get('#default-open-bottom').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'On');
    cy.get('#default-autofocus').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'On');
    cy.get('#default-diode').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'On');
    cy.contains('Reset Beam Studio').click();
    cy.contains('Next').click();
    cy.contains('Work Offline').click();
    cy.contains('Skip').click();
    cy.get('button.ant-btn').contains('No').click();
    cy.go2Preference();

    cy.wait(1000);

    cy.get('#default-open-bottom').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'Off');
    cy.get('#default-autofocus').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'Off');
    cy.get('#default-diode').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'Off');
  });
});
