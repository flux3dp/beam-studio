it('layer color setting', () => {
  cy.landingEditor();

  cy.get('div.menu-btn-container').click();
  cy.get('.rc-menu__submenu').contains('Edit').click();
  cy.get('.rc-menu__item').contains('Layer').click();
  cy.contains('Color Settings').click();
  cy.get('.ant-modal').should('be.visible');

  cy.get('.ant-btn').contains('Add Color').click();
  cy.get('.input-column input').eq(0).should('have.value', '#FFFFFF');
  cy.get('.input-column input').eq(0).clear().type('#AA0000');
  cy.get('.input-column input').eq(1).should('have.value', '50.0');
  cy.get('.input-column input').eq(1).clear().type('25');
  cy.contains('.ant-btn-primary', /^Add$/).click();

  cy.get('button.ant-pagination-item-link .anticon-right').click();
  const rowSelector = 'tr[data-row-key="#AA0000"]';
  cy.get(`${rowSelector} .config-color-block`).should(
    'have.css',
    'background-color',
    'rgb(170, 0, 0)'
  );
  cy.get(`${rowSelector} .editable-cell-value-wrap`).eq(0).should('contain.text', '#AA0000');
  cy.get(`${rowSelector} .editable-cell-value-wrap`).eq(1).should('contain.text', '10\u00a0mm/s');
  cy.get(`${rowSelector} .editable-cell-value-wrap`).eq(2).should('contain.text', '25\u00a0%');
  cy.get(`${rowSelector} .editable-cell-value-wrap`).eq(3).should('contain.text', '1');

  cy.get('.ant-btn').contains('Save').click();
  cy.get('div.menu-btn-container').click();
  cy.get('.rc-menu__submenu').contains('Edit').click();
  cy.get('.rc-menu__item').contains('Layer').click();
  cy.contains('Color Settings').click();
  cy.get('button.ant-pagination-item-link .anticon-right').click();
  cy.get(rowSelector).should('exist');

  cy.get(`${rowSelector} .anticon-delete`).should('be.visible').click();
  cy.get(rowSelector).should('not.exist');
});
