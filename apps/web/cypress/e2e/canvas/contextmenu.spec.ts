describe('canvas contextmenu', () => {
  it('canvas contextmenu with mouse', () => {
    cy.landingEditor();
    cy.get('#workarea').rightclick(100, 100);
    cy.get('.ant-dropdown').should('be.visible');

    cy.get('#workarea').click(200, 200, { force: true });
    cy.get('.ant-dropdown').should('not.be.visible');
  });

  it('canvas contextmenu with touchpad', () => {
    cy.landingEditor({
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'maxTouchPoints', {
          value: 5,
        });
      },
    });

    cy.get('.ant-dropdown').should('not.exist');

    // On real touch devices, a long press triggers a native contextmenu event.
    // antd Dropdown listens for contextmenu events (not touch sequences).
    cy.get('#workarea').rightclick(100, 100);
    cy.get('.ant-dropdown').should('be.visible');

    cy.get('#workarea').click(200, 200, { force: true });
    cy.get('.ant-dropdown').should('not.be.visible');
  });
});
