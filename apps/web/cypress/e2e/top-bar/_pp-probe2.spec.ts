const isRunningAtGithub = Cypress.env('envType') === 'github';

const wireBackendAndLand = () => {
  const ghostPort = Cypress.env('ghostPort');

  if (ghostPort) {
    cy.landingEditor({
      onBeforeLoad: (win: Window) => {
        win.localStorage.setItem('host', '127.0.0.1');
        win.localStorage.setItem('port', `${ghostPort}`);
      },
    });
  } else {
    cy.setUpBackend(Cypress.env('backendIP'));
    cy.landingEditor();
  }
};

const drawRectAt = (x1: number, y1: number, x2: number, y2: number) => {
  cy.get('#left-Rectangle').click();
  cy.get('#svgcontent').trigger('mousedown', x1, y1, { force: true, which: 1 });
  cy.get('#svgcontent').trigger('mousemove', x2, y2, { force: true, which: 1 });
  cy.get('#svgcontent').trigger('mouseup', { force: true });
};

describe('pp probe2 bottom-right time', () => {
  if (isRunningAtGithub) {
    it('skip', () => cy.log('skip'));

    return;
  }

  it('probe bottom-right estimate', () => {
    wireBackendAndLand();
    drawRectAt(80, 80, 360, 300);
    drawRectAt(140, 130, 180, 170);
    cy.get('#svg_2').should('exist');

    const out: string[] = [];

    // Open the canvas-control dropdown (bottom-right trigger).
    cy.get('#svg_editor [class*="bottom-right"] .ant-dropdown-trigger').first().click({ force: true });
    // The menu items render in a portal. Find the "Estimate time" item.
    cy.get('.ant-dropdown-menu-item').then(($items) => {
      out.push('MENU ITEMS: ' + $items.map((_i, el) => Cypress.$(el).text()).get().join(' | '));
    });
    cy.contains('.ant-dropdown-menu-item', 'Estimate time').click({ force: true });

    cy.get('[class*="timeDisplay"]', { timeout: 20000 }).should('exist');
    cy.get('[class*="timeDisplay"]').invoke('text').then((t) => out.push('timeDisplay initial: ' + t));

    // Click to calculate.
    cy.get('[class*="timeDisplay"]').click({ force: true });
    // wait for it to change from 'Estimate time'
    cy.get('[class*="timeDisplay"]', { timeout: 40000 }).should('not.contain', 'Estimate time');
    cy.get('[class*="timeDisplay"]').invoke('text').then((t) => out.push('timeDisplay calculated: ' + t));

    cy.then(() => cy.writeFile('cypress/_pp-probe2-out.txt', out.join('\n')));
  });
});
