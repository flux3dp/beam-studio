import { is } from 'cypress/types/bluebird';
import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';

const drawRectangle = () => {
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', 0, 0, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('#svg_1').should('exist');
  cy.get('.tab.objects').click();
  cy.get('#infill').click();
  cy.get('#x_position').clear().type('0{enter}');
  cy.get('#y_position').clear().type('0{enter}');
  cy.get('#w_size').clear().type('75{enter}');
  cy.get('#h_size').clear().type('75{enter}');
};

const drawEllipse = () => {
  cy.clickToolBtn('Ellipse');
  cy.get('svg#svgcontent').trigger('mousedown', 0, 0, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('#svg_2').should('exist');
  cy.get('#infill').click();
  cy.get('#cx_position').clear().type('0{enter}');
  cy.get('#cy_position').clear().type('0{enter}');
  cy.get('#rx_size').clear().type('150{enter}');
  cy.get('#ry_size').clear().type('150{enter}');
};

const drawText = () => {
  cy.clickToolBtn('Text');
  cy.get('svg#svgcontent').realClick({ x: 0, y: 0 });
  // Wait for text element to be created
  cy.get('#svg_2').should('exist');
  cy.inputText('ABC');
  cy.get('.tab.objects').click();
  cy.get('#infill').click();
  cy.get('#x_position').clear().type('0{enter}');
  cy.get('#y_position').clear().type('0{enter}');
  cy.get('#w_size').clear().type('75{enter}');
  cy.get('#h_size').clear().type('75{enter}');
};

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

describe('shapes boolean operation', () => {
  beforeEach(() => {
    cy.landingEditor();
    drawRectangle();
    drawEllipse();
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

describe('text and shapes boolean operation', () => {
  beforeEach(() => {
    cy.landingEditor();
    drawRectangle();
    drawText();
    selectAll();
  });

  it('union', () => {
    cy.get('#union').click();
    cy.get('#svg_6')
      .invoke('attr', 'd')
      .then((d) =>
        expect(md5(d)).equal(
          isRunningAtGithub ? 'e54234e8e5ede68a50b6244fb1aec336' : 'f6ee0a6ce2a58fe226cad3595f284741',
        ),
      );
    checkDimensions(0, 0, isRunningAtGithub ? 106.23 : 104.77, 75);
  });

  it('subtract', () => {
    cy.get('#subtract').click();
    cy.get('#svg_6')
      .invoke('attr', 'd')
      .then((d) =>
        expect(md5(d)).equal(
          isRunningAtGithub ? 'ca83c224c6f8d083e5d63a82782d8b3f' : '2492a86b0eede32e405426dcbdc5ff0a',
        ),
      );
    checkDimensions(0, 0, 75, 75);
  });

  it('intersect', () => {
    cy.get('#intersect').click();
    cy.get('#svg_6')
      .invoke('attr', 'd')
      .then((d) =>
        expect(md5(d)).equal(
          isRunningAtGithub ? '4902ed757bc6efdb592d990da2ca431d' : 'f786bca9c5dba9f836aa0e65c7a9afc0',
        ),
      );
    checkDimensions(
      isRunningAtGithub ? 1.45 : 0,
      isRunningAtGithub ? 19.48 : 19.29,
      isRunningAtGithub ? 68.47 : 75,
      isRunningAtGithub ? 39.19 : 39.31,
    );
  });

  it('difference', () => {
    cy.get('#difference').click();
    cy.get('#svg_6')
      .invoke('attr', 'd')
      .then((d) =>
        expect(md5(d)).equal(
          isRunningAtGithub ? '58a84309685ee415e601d001eb5104a1' : '03311828449bedcb35f3241198f8f24a',
        ),
      );
    checkDimensions(0, 0, isRunningAtGithub ? 106.23 : 104.77, 75);
  });
});
