import { md5 } from '../../support/utils';

function drawingElements() {
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', 0, 0, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('#svg_1').should('exist');
  cy.wait(500);
  cy.get('.tab.objects').click();
  cy.get('#infill').click();
  cy.get('#x_position').clear().type('0{enter}');
  cy.get('#y_position').clear().type('0{enter}');
  cy.get('#w_size').clear().type('75{enter}');
  cy.get('#h_size').clear().type('75{enter}');
  cy.clickToolBtn('Ellipse');
  cy.get('svg#svgcontent').trigger('mousedown', 0, 0, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('#svg_2').should('exist');
  cy.wait(500);
  cy.get('#infill').click();
  cy.get('#cx_position').clear().type('0{enter}');
  cy.get('#cy_position').clear().type('0{enter}');
  cy.get('#rx_size').clear().type('150{enter}');
  cy.get('#ry_size').clear().type('150{enter}');
  cy.wait(500);
}

function selectAll() {
  cy.clickToolBtn('Cursor');
  cy.get('svg#svgcontent').trigger('mousedown', -100, -100, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.getElementTitle().should('have.text', 'Multiple Objects');
}

function checkDimensions(x: number, y: number, w: number, h: number) {
  cy.inputValueCloseTo('#x_position', x, 0.01);
  cy.inputValueCloseTo('#y_position', y, 0.01);
  cy.inputValueCloseTo('#w_size', w, 0.01);
  cy.inputValueCloseTo('#h_size', h, 0.01);
}

describe('object boolean tools', () => {
  beforeEach(() => {
    cy.landingEditor();
    drawingElements();
    selectAll();
  });

  it('union', () => {
    cy.get('#union').click();
    cy.get('#svg_4')
      .invoke('attr', 'd')
      .then((d) => expect(md5(d)).equal('912e2860d13f9628cda3a6d6772f2f4c'));
    checkDimensions(-75, -75, 150, 150);
  });

  it('subtract', () => {
    cy.get('#subtract').click();
    cy.get('#svg_4')
      .invoke('attr', 'd')
      .then((d) => expect(md5(d)).equal('5cdceb1e2f74d60a431465fc7f1cf605'));
    checkDimensions(0, 0, 75, 75);
  });

  it('intersect', () => {
    cy.get('#intersect').click();
    cy.get('#svg_4')
      .invoke('attr', 'd')
      .then((d) => expect(md5(d)).equal('5c625cfbecc7ac0aae927cb7db4e85ea'));
    checkDimensions(0, 0, 75, 75);
  });

  it('difference', () => {
    cy.get('#difference').click();
    cy.get('#svg_4')
      .invoke('attr', 'd')
      .then((d) => expect(md5(d)).equal('c6ad6181d778be740f9fde2d8bd650cf'));
    checkDimensions(-75, -75, 150, 150);
  });
});
