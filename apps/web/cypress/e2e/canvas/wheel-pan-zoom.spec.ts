const zoomBlockPrefix = '_-_-packages-core-src-web-app-components-common-ZoomBlock-module_';
const zoomRatioText = () => cy.get(`[class*="${zoomBlockPrefix}_ratio"]`);

const readRatio = ($div: JQuery<HTMLElement>) => parseInt($div.text().replace('%', ''), 10);

describe('wheel / pan / zoom the canvas', () => {
  beforeEach(() => {
    cy.landingEditor();
    // Ensure the ZoomBlock is mounted before interacting.
    cy.get(`[class*="${zoomBlockPrefix}_ratio"]`).should('exist');
  });

  // A single wheel notch. ctrlKey makes the handler zoom on every OS
  // (Mac requires ctrlKey; Windows/Linux treat any wheel event as a mouse-zoom).
  // wheelDelta is what the handler reads (`wheelDelta ?? -detail`); a large
  // magnitude keeps the per-notch step well above the 1%-rounding of the display.
  const wheelZoom = (wheelDelta: number) =>
    cy.get('#svgcanvas').trigger('wheel', {
      clientX: 640,
      clientY: 400,
      ctrlKey: true,
      deltaY: wheelDelta > 0 ? -300 : 300,
      wheelDelta,
      bubbles: true,
      force: true,
    });

  // Read the ratio only once it has stopped changing, so we never capture a value
  // mid auto-fit or mid wheel-handler debounce. `should` retries (Cypress-native,
  // no fixed waits) until two consecutive reads match, then yields that value.
  const getSettledRatio = (): Cypress.Chainable<number> => {
    let prev = Number.NaN;

    return zoomRatioText()
      .should(($div) => {
        const current = readRatio($div);
        const settled = current === prev;

        prev = current;
        expect(settled, 'zoom ratio settled').to.equal(true);
      })
      .then(($div) => readRatio($div));
  };

  it('wheel zoom in and out changes the ZoomBlock ratio', () => {
    getSettledRatio().then((baseRatio) => {
      // Zoom in a few notches so the change clears the 1%-rounding threshold.
      wheelZoom(600);
      wheelZoom(600);

      getSettledRatio().then((zoomedInRatio) => {
        expect(zoomedInRatio).to.be.greaterThan(baseRatio);

        // Zoom back out.
        wheelZoom(-600);
        wheelZoom(-600);

        getSettledRatio().then((zoomedOutRatio) => {
          expect(zoomedOutRatio).to.be.lessThan(zoomedInRatio);
        });
      });
    });
  });

  it('wheel zoom is view-only and does not move objects', () => {
    // Draw a rect, capture its geometry attributes.
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });

    cy.get('#svg_1').then(($rect) => {
      const rectX = $rect.attr('x');
      const rectY = $rect.attr('y');
      const rectW = $rect.attr('width');
      const rectH = $rect.attr('height');

      getSettledRatio().then((baseRatio) => {
        // Zoom in via wheel.
        wheelZoom(600);
        wheelZoom(600);

        // Ratio must have increased (zoom happened) ...
        getSettledRatio().then((zoomedRatio) => {
          expect(zoomedRatio).to.be.greaterThan(baseRatio);
        });

        // ... but the SVG geometry attributes are untouched (zoom is view-only).
        cy.get('#svg_1').should('have.attr', 'x', rectX);
        cy.get('#svg_1').should('have.attr', 'y', rectY);
        cy.get('#svg_1').should('have.attr', 'width', rectW);
        cy.get('#svg_1').should('have.attr', 'height', rectH);
      });
    });
  });

  it('space-drag pans the workarea without moving objects', () => {
    // Draw a rect so we can assert its attributes are untouched by panning.
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });

    cy.get('#svg_1').then(($rect) => {
      const rectX = $rect.attr('x');
      const rectY = $rect.attr('y');

      cy.get('#workarea').then(($wa) => {
        const startScrollLeft = $wa[0].scrollLeft;
        const startScrollTop = $wa[0].scrollTop;

        // Hold Space to enter pan mode (keydown on document sets keypan = true).
        cy.document().trigger('keydown', { key: ' ', code: 'Space' });

        // Drag on the canvas: pan is bound to #svgcanvas mousedown/mousemove/mouseup.
        cy.get('#svgcanvas')
          .trigger('mousedown', { button: 0, clientX: 700, clientY: 500, force: true })
          .trigger('mousemove', { button: 0, clientX: 580, clientY: 380, force: true })
          .trigger('mouseup', { button: 0, clientX: 580, clientY: 380, force: true });

        cy.document().trigger('keyup', { key: ' ', code: 'Space' });

        // Pan moved the mouse up-and-left, so scroll increases (scrollLeft -= (dx<0)).
        cy.get('#workarea').should(($after) => {
          expect($after[0].scrollLeft).to.be.greaterThan(startScrollLeft);
          expect($after[0].scrollTop).to.be.greaterThan(startScrollTop);
        });
      });

      // Objects must not move (pan is view-only).
      cy.get('#svg_1').should('have.attr', 'x', rectX);
      cy.get('#svg_1').should('have.attr', 'y', rectY);
    });
  });

  it('middle-button drag pans the workarea', () => {
    cy.get('#workarea').then(($wa) => {
      const startScrollLeft = $wa[0].scrollLeft;
      const startScrollTop = $wa[0].scrollTop;

      // Middle-button (button === 1) drag pans regardless of the space key.
      cy.get('#svgcanvas')
        .trigger('mousedown', { button: 1, clientX: 700, clientY: 500, force: true })
        .trigger('mousemove', { button: 1, clientX: 580, clientY: 380, force: true })
        .trigger('mouseup', { button: 1, clientX: 580, clientY: 380, force: true });

      cy.get('#workarea').should(($after) => {
        expect($after[0].scrollLeft).to.be.greaterThan(startScrollLeft);
        expect($after[0].scrollTop).to.be.greaterThan(startScrollTop);
      });
    });
  });
});
