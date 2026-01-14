describe('canvas contextmenu', () => {
  it('canvas contextmenu with mouse', () => {
    cy.landingEditor();
    cy.get('#svg_editor > div > nav.react-contextmenu').should('not.visible');
    cy.get('#workarea').rightclick(100, 100);
    cy.get('#svg_editor > div > nav.react-contextmenu').should('be.visible');

    cy.get('#workarea').trigger('mousedown', 200, 200, { force: true });
    cy.get('#workarea').trigger('mouseup', { force: true });
    cy.get('#svg_editor > div > nav.react-contextmenu').should('not.visible');
  });

  it('canvas contextmenu with touchpad', () => {
    cy.landingEditor({
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'maxTouchPoints', {
          value: 5,
        });
      },
    });

    const touch = {
      pageX: 100,
      pageY: 100,
      target: {
        dispatchEvent: () => {},
      },
    };

    cy.get('#svg_editor > div > nav.react-contextmenu').should('not.visible');

    cy.get('#workarea').trigger('touchstart', {
      touches: [touch],
      changedTouches: [touch],
    });
    cy.wait(1200);
    cy.get('#workarea').trigger('touchend', {
      touches: [],
      changedTouches: [touch],
    });
    cy.get('#svg_editor > div > nav.react-contextmenu').should('be.visible');

    cy.get('#workarea').trigger('mousedown', 200, 200, { force: true });
    cy.get('#workarea').trigger('mouseup', { force: true });
    cy.get('#svg_editor > div > nav.react-contextmenu').should('not.visible');
  });
});
