describe('reset', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('reset unit', () => {
    cy.go2Preference();
    cy.get('#set-default-units').select('Inches');
    cy.get('.btn.btn-done').click();
    cy.go2Preference();
    cy.get('#set-default-units').contains('Inches').should('exist');
    cy.contains('Reset Beam Studio').click();
    cy.contains('Next').click();
    cy.contains('Work Offline').click();
    cy.contains('Skip').click();
    cy.get('button.ant-btn').contains('No').click();
    cy.get('button.ant-btn').contains('No').click();
    cy.get('button.ant-btn').contains('No').click();
    cy.go2Preference();
    cy.get('#set-default-units').contains('mm').should('exist');
  });

  it('reset openbottom / autofocus / diodelaser', () => {
    cy.go2Preference();
    cy.get('#default-open-bottom').select('On');
    cy.get('#default-autofocus').select('On');
    cy.get('#default-diode').select('On');
    cy.get('.btn.btn-done').click();
    cy.go2Preference();
    cy.get('#default-open-bottom').should('have.value', 'TRUE');
    cy.get('#default-autofocus').should('have.value', 'TRUE');
    cy.get('#default-diode').should('have.value', 'TRUE');
    cy.contains('Reset Beam Studio').click();
    cy.contains('Next').click();
    cy.contains('Work Offline').click();
    cy.contains('Skip').click();
    cy.get('button.ant-btn').contains('No').click();
    cy.get('button.ant-btn').contains('No').click();
    cy.get('button.ant-btn').contains('No').click();
    cy.go2Preference();
    cy.get('#default-open-bottom').should('have.value', 'FALSE');
    cy.get('#default-autofocus').should('have.value', 'FALSE');
    cy.get('#default-diode').should('have.value', 'FALSE');
  });
});
