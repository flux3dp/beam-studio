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

const enterPathPreview = () => {
  cy.get('[title="Path Preview"]').click({ force: true });
  cy.get('#path-preview-panel', { timeout: 40000 }).should('exist');
  cy.get('#path-preview-side-panel', { timeout: 40000 }).should('exist');
  cy.get('#path-preview-side-panel', { timeout: 40000 }).should('not.contain', 'NaN');
  cy.get('#progress-bar input.slider', { timeout: 40000 }).should('exist');
};

describe('pp probe', () => {
  if (isRunningAtGithub) {
    it('skip', () => cy.log('skip'));

    return;
  }

  it('probe positions + time', () => {
    wireBackendAndLand();
    // Big enclosing rect
    drawRectAt(80, 80, 360, 300);
    // Inner small rects
    drawRectAt(140, 130, 180, 170);
    drawRectAt(220, 130, 260, 170);
    drawRectAt(180, 210, 220, 250);
    cy.get('#svg_4').should('exist');
    enterPathPreview();

    const out: string[] = [];

    // Dump side panel text.
    cy.get('#path-preview-side-panel').invoke('text').then((t) => {
      out.push('SIDE PANEL TEXT: ' + t);
    });

    // Also dump bounding box of svg elements in gcode-ish terms via svgcontent.
    cy.get('#svgcontent').then(($c) => {
      out.push('SVGCONTENT viewBox=' + $c.attr('viewBox') + ' w=' + $c.attr('width') + ' h=' + $c.attr('height'));
    });

    // Read slider max, then sample positions across the range.
    cy.get('#progress-bar input.slider').then(($s) => {
      const max = Number(($s[0] as HTMLInputElement).max);

      out.push('SLIDER MAX (min): ' + max);

      const samples = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0];

      samples.forEach((frac) => {
        const val = (max * frac).toFixed(4);

        cy.get('#progress-bar input.slider')
          .invoke('val', val)
          .trigger('input')
          .trigger('change');
        cy.get('#path-preview-side-panel').then(($p) => {
          const txt = $p.text();
          const m = txt.match(/Current Position(-?[0-9]+, -?[0-9]+) mm/);

          out.push(`FRAC ${frac} val=${val} pos=` + (m ? m[1] : '(none)'));
        });
      });
    });

    cy.then(() => {
      cy.writeFile('cypress/_pp-probe-out.txt', out.join('\n'));
    });
  });
});
