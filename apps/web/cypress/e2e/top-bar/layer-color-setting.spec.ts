it('layer color setting', () => {
  cy.landingEditor();

  cy.get('div.menu-btn-container').click();
  cy.get('.rc-menu__submenu').contains('Edit').click();
  cy.get('.rc-menu__item').contains('Layer').click();
  cy.contains('Color Settings').click();
  cy.get('.ant-modal').should('be.visible');

  cy.get('.ant-btn').contains('Add Color').click();
  // Open color picker and select color via hex input (scope to the Add Color modal)
  // Wait for Add Color modal to be fully rendered
  cy.get('.ant-modal').last().find('[class*="ColorPicker-module__trigger"]').should('be.visible').click();
  cy.get('.ant-color-picker-hex-input input').clear().type('AA0000', { delay: 100 });
  cy.get('.ant-color-picker').contains('OK').click();
  // Update power value (first input in the Add Color modal, Power field)
  cy.get('.ant-modal').last().find('.ant-input-number-input').first().clear().type('25');
  cy.contains('.ant-btn-primary', /^Add$/).click();

  cy.get('button.ant-pagination-item-link .anticon-right').click();
  const rowSelector = 'tr[data-row-key="#AA0000"]';
  cy.get(`${rowSelector} .config-color-block`).should('have.css', 'background-color', 'rgb(170, 0, 0)');
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

  // Close the modal to ensure clean state for subsequent test runs
  cy.get('.ant-btn').contains('Save').click();
  cy.get('.ant-modal').should('not.exist');
});
