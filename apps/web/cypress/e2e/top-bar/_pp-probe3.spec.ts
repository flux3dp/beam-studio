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

describe('pp probe3 both time surfaces', () => {
  if (isRunningAtGithub) {
    it('skip', () => cy.log('skip'));

    return;
  }

  it('probe both surfaces same scene', () => {
    wireBackendAndLand();
    drawRectAt(80, 80, 360, 300);
    drawRectAt(140, 130, 180, 170);
    drawRectAt(220, 130, 260, 170);
    drawRectAt(180, 210, 220, 250);
    cy.get('#svg_4').should('exist');

    const out: string[] = [];

    // Bottom-right estimate first (canvas mode).
    cy.get('#svg_editor [class*="bottom-right"] .ant-dropdown-trigger').first().click({ force: true });
    cy.contains('.ant-dropdown-menu-item', 'Estimate time').click({ force: true });
    cy.get('[class*="timeDisplay"]', { timeout: 20000 }).should('exist').click({ force: true });
    cy.get('[class*="timeDisplay"]', { timeout: 40000 }).should('not.contain', 'Estimate time');
    cy.get('[class*="timeDisplay"]').invoke('text').then((t) => out.push('BOTTOM-RIGHT: ' + t));

    // Now enter path preview.
    cy.get('[title="Path Preview"]').click({ force: true });
    cy.get('#path-preview-side-panel', { timeout: 40000 }).should('exist').should('not.contain', 'NaN');
    cy.get('#path-preview-side-panel').invoke('text').then((t) => {
      const m = t.match(/Total Time Estimated(.*?)Cut Time/);

      out.push('SIDE PANEL estTime: ' + (m ? m[1] : '(none)'));
    });

    cy.then(() => cy.writeFile('cypress/_pp-probe3-out.txt', out.join('\n')));
  });
});
